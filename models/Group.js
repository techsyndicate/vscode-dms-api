const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date_of_creation: {
        type: Date,
        required: true
    },
    admin: {
        type: String,
        required: true
    },
    members: {
        type: Array,
        required: true
    },
    conversation_id: {
        type: String,
        required: true
    },
    avatar_url: {
        type: String,
        required: true
    },
    last_message_time: {
        type: Date,
        required: false
    },
    last_message: {
        type: String,
        required: false
    },
    last_message_author: {
        type: String,
        required: false
    }
})

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;