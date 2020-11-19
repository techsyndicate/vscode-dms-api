const express = require('express');
const router = express.Router();
const axios = require('axios');
const { oauthHeader } = require('../controllers/constants');
const Messages = require('../models/Message');

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

module.exports = router