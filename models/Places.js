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
    // Novos campos para controle de reservas
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
        type: Number, // duração padrão em minutos
        default: 60,
        required: true
    },
    // Horários de funcionamento
    openingTime: {
        type: String, // formato "HH:MM" (ex: "08:00")
        required: true,
        default: "08:00"
    },
    closingTime: {
        type: String, // formato "HH:MM" (ex: "22:00")
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
            type: Number, // tempo mínimo entre reservas (minutos)
            default: 0
        }
    }
});

module.exports = mongoose.model('Place', placeSchema);