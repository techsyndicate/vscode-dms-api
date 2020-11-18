const express = require('express');
const router = express.Router();
const axios = require('axios');
const { oauthHeader } = require('../controllers/constants');
const Messages = require('../models/Message');

router.get('/:username', (req, res) => {
    const accessToken = req.query.access_token;
    const receiver = req.params.username;
    let sender = '';
    axios.get('https://api.github.com/user', oauthHeader(accessToken))
        .then((response) => sender = response.data.login);

    let conversationId = '';
    if (charCodeAt(sender[0]) < charCodeAt(receiver[0])){
        conversationId = sender + receiver;
    } else {
        conversationId = receiver + sender;
    }

    Messages.find({ conversation_id: conversationId })
        .sort({date: 'desc'})
        .then(messages => res.json(messages))
        .catch(err => console.log(err));
});