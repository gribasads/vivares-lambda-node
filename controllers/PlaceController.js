const Place = require("../models/Places");
const Condominium = require("../models/Condominium");
const db = require("../utils/db");
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configuração do S3 com mais opções
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  signatureVersion: 'v4',
  s3ForcePathStyle: true
});

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': process.env.STAGE === 'local' ? 'http://localhost:3001' : 'https://vivares-web.vercel.app',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type,Token,token,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
  },
  body: JSON.stringify(body)
});

exports.createPlace = async (event) => {
  try {
    await db.ensureConnection();
    const placeData = JSON.parse(event.body);

    // Validação do ID do condomínio
    if (!placeData.condominium) {
      return createResponse(400, { error: "ID do condomínio é obrigatório" });
    }

    // Verifica se o condomínio existe
    const condominium = await Condominium.findById(placeData.condominium);
    if (!condominium) {
      return createResponse(404, { error: "Condomínio não encontrado" });
    }

    // Gerar ID único automaticamente se não fornecido
    if (!placeData.id) {
      placeData.id = uuidv4();
    }

    const place = new Place(placeData);
    await place.save();
    return createResponse(201, place);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getPlaces = async (event) => {
  try {
    await db.ensureConnection();
    const places = await Place.find();
    return createResponse(200, places);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getPlacesByCondominium = async (event) => {
  try {
    await db.ensureConnection();
    const places = await Place.find({ condominium: event.pathParameters.id });
    return createResponse(200, places);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getPlace = async (event) => {
  try {
    await db.ensureConnection();
    const place = await Place.findById(event.pathParameters.id);
    if (!place) {
      return createResponse(404, { error: "Local não encontrado" });
    }
    return createResponse(200, place);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updatePlace = async (event) => {
  try {
    await db.ensureConnection();
    const place = await Place.findByIdAndUpdate(
      event.pathParameters.id,
      JSON.parse(event.body),
      { new: true }
    );
    if (!place) {
      return createResponse(404, { error: "Local não encontrado" });
    }
    return createResponse(200, place);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deletePlace = async (event) => {
  try {
    await db.ensureConnection();
    const place = await Place.findByIdAndDelete(event.pathParameters.id);
    if (!place) {
      return createResponse(404, { error: "Local não encontrado" });
    }
    return createResponse(200, { message: "Local removido com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.uploadPlaceImage = async (event) => {
  try {
    console.log('Iniciando upload de imagem...');
    console.log('Headers recebidos:', event.headers);
    console.log('Bucket configurado:', process.env.AWS_BUCKET_NAME);
    console.log('Região configurada:', process.env.AWS_REGION);

    // Verifica se o Content-Type está presente
    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    if (!contentType) {
      console.log('Content-Type não encontrado nos headers');
      return createResponse(415, { error: "Content-Type não especificado" });
    }

    // Verifica se é uma imagem
    if (!contentType.startsWith('image/')) {
      console.log('Content-Type inválido:', contentType);
      return createResponse(415, { error: "O arquivo deve ser uma imagem" });
    }

    const base64Data = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = contentType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;

    console.log('Preparando upload para o S3...');
    console.log('Nome do arquivo:', fileName);
    console.log('Tipo do conteúdo:', contentType);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `places/${fileName}`,
      Body: buffer,
      ContentType: contentType
    };

    console.log('Parâmetros do upload:', JSON.stringify(params, null, 2));

    const result = await s3.upload(params).promise();
    console.log('Upload concluído com sucesso:', result.Location);
    
    return createResponse(200, { url: result.Location });
  } catch (error) {
    console.error('Erro detalhado no upload:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      requestId: error.requestId
    });
    return createResponse(500, { 
      error: error.message,
      code: error.code,
      requestId: error.requestId
    });
  }
}; 