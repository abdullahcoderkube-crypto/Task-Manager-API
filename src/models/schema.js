const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TaskSchema = new mongoose.Schema({
    title : {
        type: String, 
        required: [true, "Please provide a title!"], 
        trim: true
    }, 
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    completed: {
        type: Boolean, 
        default: false
    }, 
    deadline: {
        type: Date, 
        required: true
    },
    createdAt: {
        type: Date, 
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
        console.log("User\'s password hashed and secured using bcrypt")
    }
});

TaskSchema.post('save', async function (doc) {
    console.log("New Task named: " + doc.title + " created at: " + doc.createdAt)
});



const Task = mongoose.model('Task', TaskSchema);

const User = mongoose.model('User', userSchema);

module.exports = {Task, User};