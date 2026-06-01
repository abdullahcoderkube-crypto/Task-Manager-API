const {body, validationResult} = require('express-validator');

const requestValidate = [
    body('email').isEmail().withMessage('Please provide a valid email').trim(), 
    body('password').isLength({min: 5}).withMessage('Password must be at least 5 characters'), 
    (req, res, next) => {
        const result = validationResult(req);
        if (! result.isEmpty()) {
            return res.status(400).json({
                errors: result.array()
            })
        }
        next();
    }
]



module.exports = requestValidate