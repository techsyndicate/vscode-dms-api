const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");
const socketIO = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
const jsStringEscape = require('js-string-escape');
const stt = require('spaces-to-tabs');
require('dotenv').config();

const db = process.env.MONGODB_URL;

const app = express();

const port = process.env.PORT || 3000;
const server = app.listen(port, (err) => {
    console.log(`API listening on ${port}!`);
    if (err) throw err;
});

const io = socketIO(server, { cors: true, origins: '*:*' });

const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin');
const usersRouter = require('./routes/users');
const messageRouter = require('./routes/messages');

mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));
mongoose.set('useFindAndModify', false);

app.use(express.json(({ limit: '50mb' })));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/api', indexRouter);
app.use('/api/users/signin', signinRouter);
app.use('/api/users', usersRouter);
app.use('/api/messages', messageRouter);

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('disconnect', async() => {
        let user = await User.findOne({ socket_id: socket.id })
        user.socket_id = ""
        user.save()
        io.sockets.emit('status', { user: user.username, status: 'offline' })
    })
    socket.on('send-message', async(msg) => {
        msg = JSON.parse(msg)
        console.log(msg.message)
        let user = await User.findOne({ access_token: msg.access_token })
        if (user.username == msg.sender) {
            let message = new Message({
                date: msg.date,
                sender: msg.sender,
                receiver: msg.receiver,
                type: msg.type,
                message: jsStringEscape(msg.message).replace(/    /g, "\\t"),
                conversation_id: msg.conversation_id
            })
            message.save() //save message in database
            let receiver = await User.findOne({ username: msg.receiver })
            if (receiver.socket_id) {
                io.to(receiver.socket_id).emit('receive-message', message); //send message to receiver through socket
            } else {
                console.log('User offline')
            }
            mutuals = user.contacts.mutuals
            mutuals.forEach(contact => {
                if (contact.username == msg.receiver) {
                    console.log(contact.username)
                    contact['last_message_time'] = msg.date //last message time to sort contacts
                    contact['last_message'] = msg.message //last message
                }
            })
            contacts = user.contacts
            contacts.mutuals = mutuals
            try {
                await User.findOneAndUpdate({ access_token: msg.access_token }, { contacts: contacts, chat: { last_user: msg.receiver } })
            } catch (err) {
                console.log(err)
            }
        } else {
            console.log('denied')
        }
    });
    socket.on('status', async(status) => {
        accessToken = status.user
        let user = await User.findOne({ access_token: accessToken })
        status.user = user.username
        io.sockets.emit('status', status)
    })
});

module.exports = app;