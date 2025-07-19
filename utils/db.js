const mongoose = require('mongoose');
require('dotenv').config();

let cachedConnection = null;

exports.connect = async () => {
  if (cachedConnection) {
    console.log('Usando conexão existente');
    return cachedConnection;
  }

  try {
    console.log('Tentando conectar ao MongoDB...');
    console.log('URI:', process.env.MONGO_URI);
    
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      dbName: 'vivares',
      useUnifiedTopology: true,
          serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 1,
      retryWrites: true,
      retryReads: true
    });

    cachedConnection = connection;
    console.log('MongoDB conectado com sucesso');
    return connection;
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    throw error;
  }
};

exports.ensureConnection = async () => {
  try {
    console.log('Verificando estado da conexão...');
    console.log('Estado atual:', mongoose.connection.readyState);
    
    if (!cachedConnection || mongoose.connection.readyState !== 1) {
      console.log('Conexão não está ativa, tentando reconectar...');
      await exports.connect();
    } else {
      console.log('Conexão já está ativa');
    }
  } catch (error) {
    console.error('Erro ao garantir conexão:', error);
    throw error;
  }
};
