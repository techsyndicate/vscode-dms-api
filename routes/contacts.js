const express = require('express');
const router = express.Router();
const axios = require('axios')
const { oauthHeader } = require('../controllers/constants')

router.get('/', async (req, res) => {
    let userAccessToken = req.query.access_token
    let following = await axios.get('https://api.github.com/user/following', oauthHeader(userAccessToken)).data
    let followers = await axios.get('https://api.github.com/user/followers', oauthHeader(userAccessToken)).data
});

module.exports = router;