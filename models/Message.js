const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    conversation_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
})

const Message = mongoose.model('User', MessageSchema);

module.exports = Message;