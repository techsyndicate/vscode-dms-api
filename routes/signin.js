const express = require('express');
const axios = require('axios')
const router = express.Router();
const User = require('../models/User')
const { oauthHeader } = require('../controllers/constants')

router.get('/', (req, res) => {
    res.redirect('https://github.com/login/oauth/authorize?client_id=f4e3b9ab432f148406e6')
});

router.get('/callback', (req, res) => {
    let code = req.query.code
    axios.post('https://github.com/login/oauth/access_token', {
            client_id: 'f4e3b9ab432f148406e6',
            client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
            code: code
        })
        .then(async(response) => {
            let accessToken = response.data.split('&')[0].split('=')[1]
            let profileRes = await axios.get('https://api.github.com/user', oauthHeader(accessToken))
            let username = profileRes.data.login
            let img = profileRes.data.avatar_url
            User.findOne({ username: username }).then((user) => {
                if (!user) { //see if user already exists
                    let newUser = User({
                        username,
                        access_token: accessToken,
                        img
                    })
                    newUser.save()
                } else { //if user exists, update access token
                    if (accessToken != user.access_token) {
                        user.access_token = accessToken
                        user.save()
                    }
                }
            })
            res.redirect(`http://localhost:15015/callback/${accessToken}`) //redirect for vscode extension to fetch token
        })
        .catch(function(error) {
            console.log(error);
        });
})

module.exports = router;