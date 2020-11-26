const express = require('express');
const User = require('../models/User');
const router = express.Router();
const axios = require('axios')
const FormData = require('form-data')

router.post('/', async(req, res) => {
    let accessToken = req.query.access_token
    let base64Image = req.body.base64
    let user = await User.findOne({ access_token: accessToken }) // to see if user is eligible to upload image
    if (user) {
        let bodyFormData = FormData()
        bodyFormData.append('image', base64Image)
        try {
            let response = await axios.post('https://api.imgur.com/3/upload', { data: bodyFormData, headers: { 'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}` } }) // too many requests
            console.log(response.body)
        } catch (err) {
            res.send(err)
        }
    }
});

module.exports = router