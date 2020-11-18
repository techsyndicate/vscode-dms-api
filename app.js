const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");
const socketIO = require('socket.io');
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
app.use('./api/messages', messageRouter);

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('chat message', msg => {
        console.log(msg);
    });
});

module.exports = app;