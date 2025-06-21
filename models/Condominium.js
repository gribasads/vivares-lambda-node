const mongoose = require('mongoose');

const condominiumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        street: String,
        number: String,
        city: String,
        state: String,
        zip: String
    },
    cnpj: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Condominium', condominiumSchema);
