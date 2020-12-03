'user strict';

// db setting / connect to DB -> and connection Test
const connection = require('../models/database');
const axios = require('axios');
const request = require('request');
const appConfig = require('dotenv').config(); // env config ------

// call back 지옥 탈출을 위한 추가 db모듈 
const pool = require('../models/database2');

// Object constructor ~ DTO
const UserCard = require('../models/UserCardsDTO');
const bcrypt = require('bcrypt'); // hashing the password
const saltRounds = 10;

// casting Date to yyyymmdd
Date.prototype.yyyymmdd = function () {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join('');
};

// Check every empty condtion
const isAllEmpty = (value) => {
    if (value == "" || value == null || value == undefined ||
        (value != null && typeof value == "object" && !Object.keys(value).length)) return true;
    else return false;
};

// 오늘 날짜 + 시간 + 난수 기반으로 만드는 랜덤 Tuno value
const randomIsTuno = (date) => {
    const time = (new Date).getTime();
    return date + String(time);
}

//////////////////////////////////////////////////// make NH's API methods
// NH API 공통부(Header) 생성
const setHeader = (apiName) => {
    return {
        "ApiNm": apiName,
        "Tsymd": String(new Date().yyyymmdd()),
        "Trtm": "112428",
        "Iscd": String(appConfig.parsed.ISCD),
        "FintechApsno": "001",
        "ApiSvcCd": "DrawingTransferA",
        "IsTuno": String(randomIsTuno(new Date().yyyymmdd())).slice(0, 20),
        "AccessToken": String(appConfig.parsed.ACCESS_TOKEN)
    };
};

// Axios to NH API
const nhAPIUrl = "https://developers.nonghyup.com";
/**
 * @desc    - 핀-카드 직접 발급 /OpenFinCardDirect.nh
 * @method  - POST
 * @apiDocs - https://developers.nonghyup.com/guide/GU_1030 
 */
UserCard.OpenFinCardDirect = async function (userBirth, cardno, result) {
    // console.log(`UserCardServeice OpenFinCardDirect, ${userBirth}, ${cardno}`);
    // console.log(setHeader("OpenFinCardDirect"));
    await axios.request({
        method: 'POST',
        url: `${nhAPIUrl}/OpenFinCardDirect.nh`,
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: {
            "Header": setHeader("OpenFinCardDirect"),
            "Brdt": String(userBirth),
            "Cano": String(cardno)
        }
    }).then(response => {
        const { data: responseBody, status: responseCode } = response;
        if (responseCode == 200) result(null, responseBody);
        else {
            console.log(responseBody + ", Status code: " + responseCode);
            result(null, responseBody);
        }
    }).catch(e => {
        console.error(`UserCardServeice OpenFinCardDirect: ${e}`);
        result(e, null);
    });
}


/**
 * @desc    - 핀-카드 직접 발급 확인 /CheckOpenFinCardDirect.nh
 * @method  - POST
 * @apiDocs - https://developers.nonghyup.com/guide/GU_1040
 */
UserCard.CheckOpenFinCardDirect = async function (userBirth, pinCard, result) {
    // console.log(`UserCardServeice CheckOpenFinCardDirect, ${userBirth}, ${pinCard}`);
    // console.log(setHeader("CheckOpenFinCardDirect"));
    await axios.request({
        method: 'POST',
        url: `${nhAPIUrl}/CheckOpenFinCardDirect.nh`,
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: {
            "Header": setHeader("CheckOpenFinCardDirect"),
            "Rgno": String(pinCard),
            "Brdt": String(userBirth)
        }
    }).then(response => {
        const { data: responseBody, status: responseCode } = response;
        if (responseCode == 200) result(null, responseBody);
        else {
            console.log(responseBody + ", Status code: " + responseCode);
            result(null, responseBody);
        }
    }).catch(e => {
        console.error(`UserCardServeice CheckOpenFinCardDirect: ${e}`);
        result(e, null);
        // throw new Error(`UserCardServeice CheckOpenFinCardDirect: ${e}`);
    });
}


//////////////////////////////////////////////////// make Task's methods
// result는 callback함수의 결과임 

// Create a user
UserCard.creatUserCard = async function (newUserCard, result) {
    try {
        // 유저 핀 카드 넘버  복호화 할까 말까 고민 필요!
        // newUser.password = bcrypt.hashSync(newUser.password, saltRounds);
        connection.query("INSERT INTO user_cards set ?", newUserCard, function (err, res) {
            if (err) {
                console.log("creatUser service error: ", err);
                result(err, null);
            }
            else {
                // console.log("inputed Id:" + res.insertId);
                result(null, newUserCard);
            }
        });
    } catch (error) {
        console.log(`userServeice creatUser Error: ${error}`);
        throw new Error(`userServeice creatUser Error: ${error}`);
    }

};

// UserCard find By id for FinCard 중복 Check
UserCard.findByFinCard = async function (FinCard) {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query("Select * from user_cards WHERE fin_card = ?", [FinCard]);
        if (isAllEmpty(rows)) return false;
        else return rows[0];
    } catch (error) {
        console.log(`userServeice findByFinCard Error: ${error}`);
        throw new Error(`userServeice findByFinCard Error: ${error}`);
    }
};

/*
// User check the Password by bcrypt
User.verify = function (user, password) {
    try { // 지금 들어온 input password를 hashing된 DB 값과 비교해봐야함 
        return (bcrypt.compareSync(password, user.password));
    } catch (error) {
        console.log(`userServeice verify Error: ${error}`);
        throw new Error(`userServeice verify Error: ${error}`);
    }
};

 
// Get A user Information
User.getAUser = async function (id, result) {
    connection.query("Select * from users WHERE id = ?", [id], function (err, res) {
        if (err) {
            console.log("getAUser service error: ", err);
            result(null, err);
        }
        else {
            console.log('User : ', res[0]);
            result(null, res[0]);
        }
    });
};
 
User.getAllUser = async function (result) {
    connection.query("Select * from users", function (err, res) {
        if (err) {
            console.log("getAllUser service error: ", err);
            result(null, err);
        }
        else {
            console.log('User : ', res);
            result(null, res);
        }
    });
};
 
User.updateById = function (updateUser, result) {
    // parsing (ES6 문법)
    const {
        id,
        password,
        name,
        birthday,
        gender,
        login_type,
        fin_account,
        updated_at
    } = updateUser;
 
    const sql = "UPDATE users SET `password` = ?, `name` = ?, `birthday` = ?, `gender` = ?, `login_type` = ?, `fin_account` = ?, `updated_at` = ? WHERE id = ?"
    connection.query(sql, [password, name, birthday, gender, login_type, fin_account, updated_at, id],
        function (err, res) {
            if (err) {
                console.log("updateByid service error: ", err);
                result(null, err);
                // console.log(res);
            }
            else {
                // console.log(res);
                result(null, res);
            }
        }
    );
};
 
User.removeById = function (id, result) {
    connection.query("DELETE FROM users WHERE id = ?", [id], function (err, res) {
        if (err) {
            console.log("error: ", err);
            result(null, err);
        }
        else {
            result(null, res);
        }
    });
};
*/

module.exports = UserCard;