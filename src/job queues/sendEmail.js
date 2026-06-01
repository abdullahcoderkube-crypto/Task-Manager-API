require('../models/db');
const { Agenda } = require('agenda');
const { MongoBackend } = require('@agendajs/mongo-backend');
const path = require('path');
const {Task} = require('../models/schema')
const mail = require('nodemailer');
const { error } = require('console');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env')})

const agenda = new Agenda({
  backend: new MongoBackend({
    address: process.env.MONGO_URI
  })
});

 // define the job
 agenda.define('send deadline reminder', async (job) => {
    try {
    console.log("Agenda triggered!!!")
    const testAccount = await mail.createTestAccount();
    const transporter = mail.createTransport({
        host: 'smtp.ethereal.email',
        port: 587, 
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    const taskId = job.attrs.data?.taskId;
    const userEmail = job.attrs.data?.userEmail;

    const incompleteTask = await Task.findOne({ completed: false, _id: taskId })
        .select('title user createdAt deadline')
        .populate({
            path: 'user',
            select: 'email -_id', // Only get the email field, exclude the _id
            transform: (userDoc) => userDoc ? userDoc.email : null // Overwrite the object with just the email string
        })
        .lean();

    if (!incompleteTask) {
        throw new Error('Task not found or already completed');
    }

    const recipient = userEmail || incompleteTask.user;
    if (!recipient) {
        throw new Error('No recipient email available');
    }

    const task = `Title: ${incompleteTask.title}\nCreated: ${incompleteTask.createdAt}\nDeadline: ${incompleteTask.deadline}\n`;

    const mailOption = {
        from: 'abdullah.coderkube@gmail.com',
        to: recipient,
        subject: 'YOUR TASK DUE IN 1 HOUR!',
        text: task
    };

    const info = await transporter.sendMail(mailOption);
    console.log('Mail sent: ', info.messageId);
    console.log('Preview: ', mail.getTestMessageUrl(info));

    } catch (error) {
        console.error(error)
    }
});

 (async function () {await agenda.start()})();

 module.exports = agenda;
