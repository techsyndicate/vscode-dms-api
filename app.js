const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");
const socketIO = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');
const jsStringEscape = require('js-string-escape');
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

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('disconnect', async() => { // Disconnect event
        let user = await User.findOne({ socket_id: socket.id })
        user.socket_id = "" // Delete socketID from database
        user.save()
        io.sockets.emit('status', { user: user.username, status: 'offline' }) // Send status to everyone that user is offline
    })
    socket.on('send-message', async(msg) => { // Send message event
        msg = JSON.parse(msg)
        let user = await User.findOne({ access_token: msg.access_token })
        if (user.username == msg.sender) { // Confirm that the sender of the message is indeed the client side sender
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
                group.members.forEach(async(member) => {
                    let storedMember = await User.findOne({ username: member })
                    groups = storedMember.contacts.groups
                    groups.forEach(group => {
                        if (group.conversation_id == msg.conversation_id) {
                            group['last_message_time'] = msg.date // Last message time to sort contacts
                            group['last_message'] = msg.message // Last message
                            group['last_message_author'] = msg.sender // Last message author
                        }
                    })
                    contacts = storedMember.contacts
                    contacts.groups = groups
                    try {
                        await User.findOneAndUpdate({ username: member }, { contacts: contacts, chat: { last_group: true, last_user: msg.receiver, last_id: msg.conversation_id } })
                    } catch (err) {
                        console.log(err)
                    }
                })
            } else {
                let receiver = await User.findOne({ username: msg.receiver }) // Check if receiver is online
                if (receiver.socket_id) {
                    io.to(receiver.socket_id).emit('receive-message', message); // Send message to receiver through socket
                } else {
                    console.log('User offline')
                }
                mutuals = user.contacts.mutuals
                mutualsReceiver = receiver.contacts.mutuals
                mutualsReceiver.forEach(contact => { // Update the last message for receiver also
                    if (contact.username == msg.sender) {
                        contact['last_message_time'] = msg.date // Last message time to sort contacts
                        contact['last_message'] = msg.message // Last message
                        contact['last_message_author'] = msg.sender // Last message author
                    }
                })
                mutuals.forEach(contact => {
                    if (contact.username == msg.receiver) {
                        contact['last_message_time'] = msg.date // Last message time to sort contacts
                        contact['last_message'] = msg.message // Last message
                        contact['last_message_author'] = msg.sender // Last message author
                    }
                })
                contactsReceiver = receiver.contacts
                contactsReceiver.mutuals = mutualsReceiver
                contacts = user.contacts
                contacts.mutuals = mutuals
                try {
                    await User.findOneAndUpdate({ username: msg.receiver }, { contacts: contactsReceiver })
                    await User.findOneAndUpdate({ access_token: msg.access_token }, { contacts: contacts, chat: { last_user: msg.receiver } })
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
        user.contacts.groups.forEach(group => {
            socket.join(group.conversation_id)
        })
        status.user = user.username
        io.sockets.emit('status', status)
    })
});

module.exports = app;