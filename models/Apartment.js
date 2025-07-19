const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    block: {
        type: String,
        required: false
    },
    condominium: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Condominium',
        required: true
    },
        owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
});
module.exports = mongoose.model('Apartment', apartmentSchema);