const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { oauthHeader } = require('../controllers/constants');
const e = require('express');

router.get('/', (req, res) => {
    let userAccessToken = req.query.access_token
    User.findOne({ access_token: userAccessToken }).then((user) => {
        res.send(user);
    });
});

router.get('/contacts', async(req, res) => {
    const userAccessToken = req.query.access_token;
    let user = await User.findOne({ access_token: userAccessToken })

    // check if followers have changed or not
    let userResponse = await axios.get(`https://api.github.com/user`, oauthHeader(userAccessToken))
    let nofollowers = userResponse.data.followers
    let nofollowing = userResponse.data.following
    if (user.contacts && nofollowers == user.contacts.nofollowers && nofollowing == user.contacts.nofollowing) {
        let contacts = user.contacts.mutuals
        contacts.sort(function(a, b) {
            let c = new Date(a.last_message_time);
            let d = new Date(b.last_message_time);
            return d - c;
        });
        res.json(contacts)
    } else { // if followers/following have changed, generate mutual contacts again
        user.contacts = {
            mutuals: []
        }
        user.contacts.nofollowers = nofollowers;
        user.contacts.nofollowing = nofollowing;
        let contacts = await getContacts(userAccessToken);
        let storedContacts = user.contacts.mutuals;
        let storedContactsUsername = [];
        contacts.forEach(contact => {
            contact.last_message_time = '2000-01-31T00:00:00.000Z' // default date
        })
        storedContacts.forEach(value => {
            storedContactsUsername.push(value.username)
        })
        contacts.forEach(contact => {
            if (!storedContactsUsername.includes(contact.username)) {
                user.contacts.mutuals.push(contact)
            }
        })
        user.save() // save all contacts in the database for every user for faster load times and sort easily
        storedContacts = user.contacts.mutuals
        storedContacts.sort(function(a, b) {
            var c = new Date(a.last_message_time);
            var d = new Date(b.last_message_time);
            return d - c;
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

router.get('/socket/contacts', async(req, res) => {
    const accessToken = req.query.access_token;
    const socketId = req.query.socket_id;
    const user = await User.findOne({ access_token: accessToken });
    await user.updateOne({ contacts_socket_id: socketId });
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
            if (!user) {
                res.json({ status: 'unavailable' })
            } else {
                !user.socket_id ? res.json({ status: 'offline' }) : res.json({ status: 'online' });
            }
        });
    }
});

async function getContacts(userAccessToken) {
    let following = []; // list of following
    let followers = []; // list of followers
    let promises = []; // array of promises
    let followIndex = 0; // pages of followers
    let followingIndex = 0; // pages of following

    let userResponse = await axios.get(`https://api.github.com/user`, oauthHeader(userAccessToken))
    let nofollowers = userResponse.data.followers // no. of followers
    let nofollowing = userResponse.data.following // no. of following

    followIndex = Math.ceil(nofollowers / 100) // set value of followIndex using no. of followers
    followingIndex = Math.ceil(nofollowing / 100) // set value of followingIndex using no. of following

    for (let i = 1; i < followIndex + 1; i++) { // loop of requests as github api prevents from showing more than 100 follower per request
        promises.push( // push promises into a single array so they can be done later
            axios.get(`https://api.github.com/user/followers?per_page=100&page=${followIndex}`, oauthHeader(userAccessToken))
            .then(response => {
                if (Array.isArray(response.data)) {
                    response.data.forEach(value => followers.push(value.login));
                }
            })
        )
    }

    for (let i = 1; i < followingIndex + 1; i++) { // same for following
        promises.push(
            axios.get(`https://api.github.com/user/following?per_page=100&page=${followingIndex}`, oauthHeader(userAccessToken))
            .then(response => {
                if (Array.isArray(response.data)) {
                    response.data.forEach(value => {
                        following.push(value.login)
                    });
                }
            })
        )
    }

    await Promise.all(promises) // wait for all promises to pass

    let contactsList = []; // different structure for our api, we only need username and image
    let contacts = []; // final array of contacts

    following.forEach(value => { // mutual contacts
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

router.post('/unread', async(req, res) => {
    accessToken = req.query.access_token
    conversationId = req.query.conversation_id
    let user = await User.findOne({ access_token: accessToken })
    if (!user.chat.unread) {
        user.chat.unread = []
        try {
            await User.findOneAndUpdate({ access_token: accessToken }, { chat: user.chat })
            res.sendStatus(200)
        } catch (err) {
            console.log(err)
            res.sendStatus(404)
        }
    } else {
        if (!user.chat.unread.includes(conversationId)) {
            user.chat.unread.push(conversationId)
            try {
                await User.findOneAndUpdate({ access_token: accessToken }, { chat: user.chat })
                res.sendStatus(200)
            } catch (err) {
                console.log(err)
                res.sendStatus(404)
            }
        } else {
            res.sendStatus(200)
        }
    }
})

router.get('/unread', async(req, res) => {
    accessToken = req.query.access_token
    let user = await User.findOne({ access_token: accessToken })
    if (!user.chat.unread) {
        user.chat.unread = []
        await User.findOneAndUpdate({ access_token: accessToken }, { chat: user.chat })
        res.json(user.chat.unread)
    } else {
        res.json(user.chat.unread)
    }
})

router.post('/read', async(req, res) => {
    accessToken = req.query.access_token
    conversationId = req.query.conversation_id
    let user = await User.findOne({ access_token: accessToken })
    if (!user.chat.unread) {
        user.chat.unread = []
        await User.findOneAndUpdate({ access_token: accessToken }, { chat: user.chat })
        res.sendStatus(200)
    } else {
        user.chat.unread.forEach(async(value, index) => {
            if (value == conversationId) {
                user.chat.unread.splice(index, 1)
            }
        })
        try {
            await User.findOneAndUpdate({ access_token: accessToken }, { chat: user.chat })
        } catch (err) {
            console.log(err)
            res.sendStatus(404)
        }
        res.sendStatus(200)
    }
})
module.exports = router;