const express = require('express');
const path = require('path');
const io = require('socket.io')(5000);
require('dotenv').config();

const indexRouter = require('./routes/index');
const signinRouter = require('./routes/signin.js')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/users/signin', signinRouter);

io.on('connection', (socket) => {
    console.log('a user connected');
});

const port = process.env.PORT || 3000
app.listen(port, (err) => {
    console.log(`API listening on ${port}!`)
    if (err) throw err
})

module.exports = app;