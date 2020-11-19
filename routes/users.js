const express = require('express');
const router = express.Router();
const axios = require('axios');
const GitHub = require('gh.js');
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
    let following = [];
    let followers = [];
    let followIndex = 1;
    let nextFollowPage = true;
    let followingIndex = 1;
    let nextFollowingPage = true;

    while (nextFollowPage) {
        axios.get(`https://api.github.com/user/followers?per_page=100&page=${followIndex}`, oauthHeader(userAccessToken))
        .then(response => {
            if (response.data == []) { nextFollowPage = false; }
            else {
                followers = response.data.forEach(value => followers.push(value.login));
                followIndex++;
            }
        })
        .catch(err => console.log(err));

        console.log(followIndex);
    }

    console.log(followers);

    while (nextFollowingPage == true) {
        axios.get(`https://api.github.com/user/following?per_page=100&page={followingIndex}`, oauthHeader(userAccessToken))
        .then(response => {
            if (response.data == []) {
                nextFollowingPage = false;
            }
            else {
                following = response.data.forEach(value => following.push(value.login));
                followingIndex++;
            }
        })
        .catch(err => console.log(err));

        console.log(followingIndex);
    }

    console.log(following);

    let contactsList = [];
    let contacts = [];

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

    console.log(contacts.length);
    res.json(contacts);
});

router.get('/socket', async(req, res) => {
    const accessToken = req.query.access_token;
    const socketId = req.query.socket_id;
    const user = await User.findOne({ access_token: accessToken });
    await user.updateOne({ socket_id: socketId });
    res.sendStatus(200)
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