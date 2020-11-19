const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { oauthHeader } = require('../controllers/constants')

router.get('/', (req, res) => {
    let userAccessToken = req.query.access_token
    User.findOne({ access_token: userAccessToken }).then((user) => {
        res.send(user);
    });
});

router.get('/contacts', async(req, res) => {
    const userAccessToken = req.query.access_token;
    const following = [];
    const followers = [];

    await axios.get('https://api.github.com/user/following', oauthHeader(userAccessToken))
        .then(response => following = response.data.forEach(value => following.push(value.login)))
        .catch(err => console.log(err));
    await axios.get('https://api.github.com/user/followers', oauthHeader(userAccessToken))
        .then(response => followers = response.data.forEach(value => followers.push(value.login)))
        .catch(err => console.log(err));

    const contactsList = [];
    const contacts = [];

    following.forEach(value => {
        followers.includes(value) ? contactsList.push(value) : null;
    });
    contactsList.forEach(contact => {
        data = {
            'username': contact,
            'avatar_url': `https://github.com/${contact}.png`
        }
        contacts.push(data);
    });

    res.json(contacts);
});

router.get('/socket', async(req, res) => {
    const accessToken = req.query.access_token;
    const socketId = req.query.socket_id;
    const user = await User.findOne({ access_token: accessToken });
    await user.updateOne({ socket_id: socketId });
});

router.get('/dissocket', async(req, res) => {
    const accessToken = req.query.access_token;
    const user = await User.findOne({ access_token: accessToken });
    await user.updateOne({ socket_id: '' });
    res.sendStatus(200)
});

router.get('/:username/status', async(req, res) => {
    const username = req.params.username;
    const accessToken = req.query.access_token;
    const getContacts = await axios.get(`${process.env.BASE_URL}/api/users/contacts`, { params: { access_token: accessToken } });
    let contacts = [];
    getContacts.data.forEach(contact => { contacts.push(contact.username); });

    if (!contacts.includes(username)) {
        res.sendStatus(401);
    } else {
        User.findOne({ username: username }).then(user => {
            !user.socket_id ? res.json({ status: 'offline' }) : res.json({ status: 'online' });
        });
    }
});

module.exports = router;