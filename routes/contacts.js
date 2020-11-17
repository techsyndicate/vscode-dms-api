const express = require('express');
const router = express.Router();
const { oauthHeader } = require('../controllers/constants')

router.get('/', (req, res) => {
    let userAccessToken = req.query.access_token

});

module.exports = router;