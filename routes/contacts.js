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
        finalContacts.push(element)
    })
    groups = user.contacts.groups
    groups.forEach(group => {
        finalContacts.push({
            members: group.members,
            name: group.name,
            type: 'group',
            admin: group.admin,
            conversation_id: group.conversation_id,
            avatar_url: group.avatar_url
        })
    })
    res.send(finalContacts)
});

module.exports = router