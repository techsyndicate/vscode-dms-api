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
    let user = await User.findOne({ access_token: userAccessToken })
    let userResponse = await axios.get(`https://api.github.com/user`, oauthHeader(userAccessToken))
    let nofollowers = userResponse.data.followers
    let nofollowing = userResponse.data.following
    if (user.contacts && nofollowers == user.contacts.nofollowers && nofollowing == user.contacts.nofollowing) {
        let contacts = user.contacts.mutuals
        contacts.sort(function(a, b) {
            var c = new Date(a.last_message_time);
            var d = new Date(b.last_message_time);
            return c - d;
        });
        res.json(contacts)
    } else {
        user.contacts = {
            mutuals: []
        }
        user.contacts.nofollowers = nofollowers;
        user.contacts.nofollowing = nofollowing;
        let contacts = await getContacts(userAccessToken);
        let storedContacts = user.contacts.mutuals;
        let storedContactsUsername = [];
        storedContacts.forEach(value => {
            storedContactsUsername.push(value.username)
        })
        contacts.forEach(contact => {
            if (!storedContactsUsername.includes(contact.username)) {
                user.contacts.mutuals.push(contact)
            }
        })
        user.save()
        storedContacts = user.contacts.mutuals
        storedContacts.sort(function(a, b) {
            var c = new Date(a.last_message_time);
            var d = new Date(b.last_message_time);
            return c - d;
        });
        res.json(storedContacts)
    }
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

async function getContacts(userAccessToken) {
    let following = [];
    let followers = [];
    let promises = [];
    let followIndex = 0;
    let followingIndex = 0;

    let userResponse = await axios.get(`https://api.github.com/user`, oauthHeader(userAccessToken))
    nofollowers = userResponse.data.followers
    nofollowing = userResponse.data.following

    followIndex = Math.ceil(nofollowers / 100)
    followingIndex = Math.ceil(nofollowing / 100)

    for (let i = 1; i < followIndex + 1; i++) {
        promises.push(
            axios.get(`https://api.github.com/user/followers?per_page=100&page=${followIndex}`, oauthHeader(userAccessToken))
            .then(response => {
                console.log(response.data.length)
                if (Array.isArray(response.data)) {
                    response.data.forEach(value => followers.push(value.login));
                }
            })
        )
    }

    for (let i = 1; i < followingIndex + 1; i++) {
        promises.push(
            axios.get(`https://api.github.com/user/following?per_page=100&page=${followingIndex}`, oauthHeader(userAccessToken))
            .then(response => {
                console.log(response.data.length)
                if (Array.isArray(response.data)) {
                    response.data.forEach(value => {
                        following.push(value.login)
                    });
                }
            })
        )
    }

    await Promise.all(promises)

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
    return contacts;
}

module.exports = router;