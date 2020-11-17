var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.send('hello world');
});

module.exports = io => {
    io.on('connection', socket => console.log('User connected'));
    return router;
};
