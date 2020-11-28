const express = require('express');
const router = express.Router();
const createGroupConversationId = require('../controllers/groupConversationID')
const Group = require('../models/Group')
const User = require('../models/User')

router.post('/create', async(req, res) => {
    const userAccessToken = req.query.access_token
    let admin = await User.findOne({ access_token: userAccessToken })
    if (admin) {
        let name = req.body.name
        let members = req.body.members
        members.push(admin.username)
        let date = new Date()
        let conversation_id = createGroupConversationId(members, name)
        let group = new Group({
            name: name,
            date_of_creation: date,
            admin: admin.username,
            members: members,
            conversation_id: conversation_id
        })
        group.save()
        res.send(200)
    } else {
        res.sendStatus(401)
    }
});

router.post('/delete', async(req, res) => {
    let userAccessToken = req.query.access_token
    let user = User.findOne({ access_token: userAccessToken })
    if (user) {
        let name = req.body.name
        let members = req.body.members
        let conversation_id = createGroupConversationId(members, name)
        let group = await Group.findOne({ conversation_id: conversation_id })
        if (group.admin == user) {
            await Group.deleteOne({ conversation_id: conversation_id })
        } else {
            res.sendStatus(401)
        }
    } else {
        res.sendStatus(401)
    }
})

module.exports = router