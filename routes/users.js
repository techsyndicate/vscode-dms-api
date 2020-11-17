const express = require('express');
const router = express.Router();
const User = require('../models/User')

router.get('/', (req, res) => {
    let userAccessToken = req.query.access_token
    User.findOne({ access_token: userAccessToken }).then((user) => {
        res.send(user)
    })
});

module.exports = router;