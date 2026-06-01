const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({path: path.resolve(__dirname, '../../.env')})
// connect to mongoDB

const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI)
.then(()=> console.log("MongoDB connection established!"))
.catch((error) => console.error('Database Error occured: ', error.message))

