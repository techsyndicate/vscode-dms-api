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
    }
})

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;