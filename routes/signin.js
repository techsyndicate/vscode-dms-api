const express = require('express');
const axios = require('axios')
const router = express.Router();

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
        .then(function(response) {
            let accessToken = response.data.split('&')[0].split('=')[1]
            res.redirect(`http://localhost:15015/callback/${accessToken}`)
        })
        .catch(function(error) {
            console.log(error);
        });
})

module.exports = router;