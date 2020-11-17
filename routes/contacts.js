const express = require('express');
const router = express.Router();
const axios = require('axios')
const { oauthHeader } = require('../controllers/constants')

router.get('/', async (req, res) => {
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

module.exports = router;