const express = require('express')
const db = require('./models/db')
const {Task} = require('./models/schema') // DB collection
const authRouter = require('./routes/auth.routes')
const authenticate = require('./middlewares/auth.middleware')
const agenda = require('./job queues/sendEmail')

require('dotenv').config();

const app = express();
app.use(express.json());

// post task

app.post('/task', authenticate, async (req, res) => {
    try {
        const newTask = await Task.create({...req.body, user: req.user.userId})
        const {title, completed, createdAt, deadline} = newTask;

        const reminderTime = new Date(deadline.getTime() - (60 * 60 * 1000)); // calculates exactly the time to send email

        await agenda.schedule(reminderTime, 'send deadline reminder', {
            taskId: newTask._id,
            taskTitle: title,
            userEmail: req.user.email
        })

        res.status(201).json({
            message: "Task created successfully!",
            task: {
                title, 
                completed, 
                createdAt, 
                deadline
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: err.message
        })
    }
})

// get all tasks

app.get('/tasks', authenticate, async (req, res) => { 
    try {
        let tasks = []
        const page = parseInt(req.query.page) || null;
        const limit = parseInt(req.query.limit) || null;
         
        if (req.query.completed !== undefined) {
            const completed = req.query.completed === 'true';
            let skip;
            if (page && limit) {
                skip = (page -1) * limit;
            }
            tasks = await Task.find({user: req.user.userId, completed}).skip(skip).limit(limit)
            .select('title createdAt completed')
            .lean()
        } else {
            let skip;
             if (page && limit) {
                skip = (page -1) * limit;
            }
            tasks = await Task.find({user: req.user.userId})
            .skip(skip).limit(limit)
            .select('title completed createdAt user')
            .populate({
                path: 'user',
                select: 'email -_id', // Only get the email field, exclude the _id
                transform: (userDoc) => userDoc ? userDoc.email : null // Overwrite the object with just the email string
            })
            .lean();
        }

        res.status(200).json({
            tasks: tasks
        })
    } catch (err) {
        res.status(500).json({
            error: "Internal Server Error!"
        })
    }
})

// search tasks by keyword

app.get('/tasks/search/:keyword', authenticate, async (req, res) => {
    try {
        const keyword = req.params.keyword;
        const tasks = await Task.find({ user: req.user.userId, title: {$regex: keyword, $options: 'i'}})
        .select('title completed createdAt user')
        .populate({
            path: 'user', 
            select: 'email -_id',
            transform: userDoc => userDoc ? userDoc.email : null
        })
        .lean();
        if (!tasks || tasks.length === 0) {
            return res.status(200).json({ tasks: [], message: 'No tasks found!'})
        } 

        res.status(200).json(tasks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "internal server error!"})
    }
}) 

// update a task

app.put('/task/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Task.findOneAndUpdate(
            { _id: id, user: req.user.userId },
            req.body,
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                error: 'Task not found or you are not authorized to update it.'
            });
        }

        const { title, completed, createdAt } = result;
        const updatedTask = { title, completed, createdAt };

        res.status(200).json({
            updatedTask: updatedTask
        });
    } catch (err) {
        res.status(500).json({
            error: 'Internal server error: ' + err.message
        });
    }
});

// delete a task

app.delete('/task/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const deletedTask = await Task.findOneAndDelete({ _id: id, user: req.user.userId });

        if (!deletedTask) {
            return res.status(404).json({
                error: 'Task not found or you are not authorized to delete it.'
            });
        }

        res.status(204).json({
            message: 'Task deleted successfully!'
        });
    } catch (err) {
        res.status(500).json({
            error: 'Internal server error!'
        });
    }
});

// send an email


// route requests which starts from auth/
app.use('/auth', authRouter);

module.exports = app;