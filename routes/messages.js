const express = require('express');
const router = express.Router();
const axios = require('axios');
const { oauthHeader } = require('../controllers/constants');
const Messages = require('../models/Message');
const User = require('../models/User');
const e = require('express');

router.get('/:username', async(req, res) => {
    const accessToken = req.query.access_token;
    const receiver = req.params.username;
    let response = await axios.get('https://api.github.com/user', oauthHeader(accessToken))
    let sender = response.data.login

    let conversationId = '';
    if (sender < receiver) {
        conversationId = sender + receiver;
    } else {
        conversationId = receiver + sender;
    }

    console.log(conversationId)

    Messages.find({ conversation_id: conversationId })
        .sort({ date: 'asc' })
        .then(messages => {
            if (messages.length == 0) {
                res.sendStatus(404)
            } else {
                res.json(messages)
            }
        })
        .catch(err => console.log(err));
});

router.get('/group/:conversation_id', async(req, res) => {
    const accessToken = req.query.access_token;
    const conversation_id = req.params.conversation_id;
    let user = await User.findOne({ access_token: accessToken })
    if (user) {
        Messages.find({ conversation_id: conversation_id })
            .sort({ date: 'asc' })
            .then(messages => {
                if (messages.length == 0) {
                    res.sendStatus(404)
                } else {
                    res.json(messages)
                }
            })
            .catch(err => console.log(err));
    } else {
        res.sendStatus(401)
    }
})

module.exports = router