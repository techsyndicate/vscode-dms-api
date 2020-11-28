const express = require('express');
const router = express.Router();
const createGroupConversationId = require('../controllers/groupConversationID')
const Group = require('../models/Group')
const User = require('../models/User')

let colors = ['F26E5C', 'FCE060', '63E683', '6085FC', 'F52C93']

function random_item(items) {
    return items[Math.floor(Math.random() * items.length)];
}

router.post('/create', async(req, res) => {
    const userAccessToken = req.query.access_token
    let admin = await User.findOne({ access_token: userAccessToken })
    if (admin) {
        let name = req.body.name
        let members = req.body.members
        members.push(admin.username)
        let date = new Date()
        let conversation_id = createGroupConversationId(members, name)
        let color = random_item(colors)
        let avatar_url = `https://dummyimage.com/500x500/${color}/${color}`
        let group = new Group({
            name: name,
            date_of_creation: date,
            admin: admin.username,
            members: members,
            conversation_id: conversation_id,
            avatar_url: avatar_url
        })
        await group.save()
        members.forEach(async(member) => {
            let user = await User.findOne({ username: member })
            if (!user.contacts.group_no) {
                user.contacts.group_no = 0
            }
            if (!user.contacts.groups) {
                user.contacts.groups = []
            }
            group.last_message_time = '2000-01-31T00:00:00.000Z'
            user.contacts.group_no += 1
            user.contacts.groups.push(group)
            try {
                await User.findOneAndUpdate({ username: member }, { contacts: user.contacts })
            } catch (error) {
                console.log(error)
            }
        })
        res.sendStatus(200)
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