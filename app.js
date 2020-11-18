const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const db = process.env.MONGODB_URL;

const app = express();
const io = require('socket.io')(5000);

const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin');
const contactsRouter = require('./routes/contacts');
const usersRouter = require('./routes/users');
const messageRouter = require('./routes/messages')

mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/api', indexRouter);
app.use('/api/users/contacts', contactsRouter);
app.use('/api/users/signin', signinRouter);
app.use('/api/users', usersRouter);
app.use('./api/messages', messageRouter)

//io.on('connection', socket => {
//    console.log('connected');
//})

const port = process.env.PORT || 3000
app.listen(port, (err) => {
    console.log(`API listening on ${port}!`)
    if (err) throw err
})

module.exports = app;