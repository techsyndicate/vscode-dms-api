const axios = require('axios');
const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');

router.get('/', async(req, res) => {
    let userAccessToken = req.query.access_token
    finalContacts = []
    let user = await User.findOne({ access_token: userAccessToken })
    let userContacts = await axios.get(`${process.env.BASE_URL}/api/users/contacts?access_token=${userAccessToken}`)
    userContacts.data.forEach(element => {
        element['type'] = 'user'
        let conversation_id = ""
        if (element.username < user.username) {
            conversation_id = `${element.username}${user.username}`
        } else {
            conversation_id = `${user.username}${element.username}`
        }
        element['conversation_id'] = conversation_id
        finalContacts.push(element)
    })
    let groups = await Group.find({ members: user.username })
    groups.forEach(group => {
        group.type = 'group'
        finalContacts.push(group)
    })
    finalContacts.sort(function(a, b) {
        var c = new Date(a.last_message_time);
        var d = new Date(b.last_message_time);
        return d - c;
    });
    res.send(finalContacts)
});

module.exports = router