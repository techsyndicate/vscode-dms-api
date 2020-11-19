const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");
const socketIO = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message')
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/api', indexRouter);
app.use('/api/users/signin', signinRouter);
app.use('/api/users', usersRouter);
app.use('/api/messages', messageRouter);

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('disconnect', async() => {
        broadcastStatus('offline')
        console.log(socket.id)
        let user = await User.findOne({ socket_id: socket.id })
        console.log(user)
        user.socket_id = ""
        user.save()
    })
    socket.on('send-message', async(msg) => {
        msg = JSON.parse(msg)
        let user = await User.findOne({ access_token: msg.access_token })
        if (user.username == msg.sender) {
            let message = new Message({
                date: msg.date,
                sender: msg.sender,
                receiver: msg.receiver,
                type: msg.type,
                message: msg.message,
                conversation_id: msg.conversation_id
            })
            message.save()
            let receiver = await User.findOne({ username: msg.receiver })
            if (receiver.socket_id) {
                io.to(receiver.socket_id).emit('receive-message', message);
            } else {
                console.log('User offline')
            }
        } else {
            console.log('denied')
        }
    });
    socket.on("status", async(status) => {
<<<<<<< HEAD
=======
        console.log(status)
>>>>>>> 32a23103754c9bbeb73e105d84e0cb7bdb3f53b1
        let user = await User.findOne({ socket_id: socket.id })
        redirectStatus()
    })

    function broadcastStatus(status) {
        socket.broadcast.emit("status", { user: user.username, status: status })
    }

    function redirectStatus() {
        socket.broadcast.emit("status", {
            status: status,
            user: user.username
        })
    }
});

<<<<<<< HEAD
module.exports = app;
=======


module.exports = app;
>>>>>>> 32a23103754c9bbeb73e105d84e0cb7bdb3f53b1
