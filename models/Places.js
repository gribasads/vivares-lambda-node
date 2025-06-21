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
    }
    });

module.exports = mongoose.model('Place', placeSchema);