const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: Object, // Para armazenar o conteúdo do draft-js
    required: true
  },
  images: [{
    type: String, // URLs das imagens no S3
    required: false
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema); 