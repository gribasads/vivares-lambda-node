const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    placeName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Place',
        required: true
    },
    dateHour: {
        type: Date,
        required: true
    },
    username: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);