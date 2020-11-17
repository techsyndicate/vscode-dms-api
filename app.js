const express = require('express');
const path = require('path');
const io = require('socket.io')(5000);
const mongoose = require('mongoose')
require('dotenv').config();

const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin')
const contactsRouter = require('./routes/contacts');
const usersRouter = require('./routes/users')

const db = process.env.MONGODB_URL;

const app = express();

mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/users/contacts', contactsRouter);
app.use('/api/users/signin', signinRouter);
app.use('/api/users', usersRouter);

io.on('connection', (socket) => {
    console.log('a user connected');
});

const port = process.env.PORT || 3000
app.listen(port, (err) => {
    console.log(`API listening on ${port}!`)
    if (err) throw err
})

module.exports = app;