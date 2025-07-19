const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    image: [{
        type: String, 
        required: false
    }],
    needPayment: {
        type: Boolean,
        required: true
    },
    condominium: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Condominium',
        required: true
    },
    reservationType: {
        type: String,
        enum: ['single', 'multiple'],
        default: 'single',
        required: true
    },
    maxCapacity: {
        type: Number,
        default: 1,
        required: true
    },
    timeSlot: {
        type: Number,
        default: 60,
        required: true
    },
    openingTime: {
        type: String,
        required: true,
        default: "08:00"
    },
    closingTime: {
        type: String,
        required: true,
        default: "22:00"
    },
    reservationSettings: {
        allowOverlap: {
            type: Boolean,
            default: false
        },
        maxConcurrentBookings: {
            type: Number,
            default: 1
        },
        timeBuffer: {
            type: Number,
            default: 0
        }
    }
});

module.exports = mongoose.model('Place', placeSchema);