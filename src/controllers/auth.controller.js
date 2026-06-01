const {User} = require('../models/schema');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt')
require('dotenv').config({path: path.resolve(__dirname, '../../.env')})

const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
    try {
        const doesExist = await User.findOne({ email: req.body.email});
        if(doesExist) {
            return res.status(409).json({
                error: "User already exists!"
            })
        }
        const newUser = await User.create(req.body);
        res.status(201).json({
            message: "User successfully registered!", 
            user: newUser
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Internal server error!"
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const isValidUser = await User.findOne({ email: req.body.email});
        if (!isValidUser) {
            return res.status(401).json({
                message: "Invalid credentials!"
            })
        }

        const isMatch = await bcrypt.compare(req.body.password, isValidUser.password)
        if (isMatch) {
            req.user = isValidUser;
        } else {
          return res.status(401).json({
                message: "Invalid credentials!"
            })
        }

        // create an auth token (jwt)
        const { _id: id, email} = req.user;
        const payload = {
            userId : id,
            username : email
        }

        const jwtToken = await jwt.sign(payload, JWT_SECRET, {
            expiresIn: '20 minutes'
        });

        return res.status(200).json({
            message: "User successfully Logged-In", 
            JWT_TOKEN: jwtToken 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Internal server error!"
        })
    }
}

module.exports = {registerUser, loginUser}