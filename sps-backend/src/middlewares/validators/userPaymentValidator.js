'use strict';

const { check, validationResult } = require('express-validator');

const validateSnsBoardCreate = [
    check('user_id')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('SNS Board user_id can not be empty!')
        .bail(),
    check('title')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('SNS Board title can not be empty!')
        .bail(),
    check('content')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('SNS Board content can not be empty!')
        .bail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
        next();
    },
];

module.exports = {
    validateSnsBoardCreate
};