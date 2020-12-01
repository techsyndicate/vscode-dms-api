const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");
const socketIO = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');
const jsStringEscape = require('js-string-escape');
const axios = require('axios')
require('dotenv').config();

const db = process.env.MONGODB_URL;

const app = express();

const port = process.env.PORT || 3000;
const server = app.listen(port, (err) => {
    console.log(`API listening on ${port}!`);
    if (err) throw err;
});

const io = socketIO(server, { cors: true, origins: '*:*' });

// Routers
const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin');
const usersRouter = require('./routes/users');
const messageRouter = require('./routes/messages');
const groupsRouter = require('./routes/groups');
const contactsRouter = require('./routes/contacts');

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
app.use('/api/groups', groupsRouter);
app.use('/api/contacts', contactsRouter);

// Socket connection event
io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('disconnect', async() => { // Disconnect event
        let user = await User.findOne({ socket_id: socket.id })
        if (user) {
            user.socket_id = "" // Delete socketID from database
            user.save()
            io.sockets.emit('status', { user: user.username, status: 'offline' }) // Send status to everyone that user is offline
        }
    })
    socket.on('send-message', async(msg) => { // Send message event
        msg = JSON.parse(msg)
        let sender = await User.findOne({ access_token: msg.access_token })
        if (sender.username == msg.sender) { // Confirm that the sender of the message is indeed the client side sender
            let message = new Message({
                date: msg.date,
                sender: msg.sender,
                receiver: msg.receiver,
                type: msg.type,
                message: jsStringEscape(msg.message).replace(/    /g, "\\t"),
                conversation_id: msg.conversation_id,
                group: msg.group
            })
            message.save() // Save message in database
            if (msg.group) { // Check if message is for group
                io.to(msg.conversation_id).emit('receive-message', message); // Forward message to group
                let group = await Group.findOne({ conversation_id: msg.conversation_id })
                group.last_message = msg.message
                group.last_message_author = msg.sender
                group.last_message_time = msg.date
                await group.updateOne({ last_message: msg.message })
                await group.updateOne({ last_message_time: msg.date })
                await group.updateOne({ last_message_author: msg.sender })
                group.members.forEach(async(member) => {
                    let storedMember = await User.findOne({ username: member })
                    if (storedMember.socket_id == "") {
                        await axios.post(`${process.env.BASE_URL}/api/users/unread?access_token=${storedMember.access_token}&conversation_id=${msg.conversation_id}`)
                    }
                })
            } else {
                try {
                    let receiver = await User.findOne({ username: msg.receiver }) // Check if receiver is online
                    if (receiver) {
                        if (receiver.socket_id) {
                            io.to(receiver.socket_id).emit('receive-message', message); // Send message to receiver through socket
                        } else {
                            try {
                                await axios.post(`${process.env.BASE_URL}/api/users/unread?access_token=${receiver.access_token}&conversation_id=${message.conversation_id}`)
                            } catch (err) {
                                console.log(err)
                            }
                            console.log('User offline')
                        }
                        receiver.contacts.mutuals.forEach(contact => { // Update the last message for receiver also
                            if (contact.username == msg.sender) {
                                contact['last_message_time'] = msg.date // Last message time to sort contacts
                                contact['last_message'] = msg.message // Last message
                                contact['last_message_author'] = msg.sender // Last message author
                            }
                        })
                        user.contacts.mutuals.forEach(contact => {
                            if (contact.username == msg.receiver) {
                                contact['last_message_time'] = msg.date // Last message time to sort contacts
                                contact['last_message'] = msg.message // Last message
                                contact['last_message_author'] = msg.sender // Last message author
                            }
                        })
                        user.chat.last_user = msg.receiver
                        try {
                            await User.findOneAndUpdate({ username: msg.receiver }, { contacts: receiver.contacts })
                            await User.findOneAndUpdate({ access_token: msg.access_token }, { contacts: user.contacts, chat: user.chat })
                        } catch (err) {
                            console.log(err)
                        }
                    } else {
                        console.log('User doesn\'t exist.')
                    }
                } catch (err) {
                    console.log(err)
                }
            }
        } else {
            console.log('denied')
        }
    });
    socket.on('status', async(status) => {
        accessToken = status.user
        let user = await User.findOne({ access_token: accessToken })
        let groups = await Group.find({ members: user.username })
        groups.forEach(async(group) => {
            await socket.join(group.conversation_id)
        })
        status.user = user.username
        io.sockets.emit('status', status)
    })
});

module.exports = app;