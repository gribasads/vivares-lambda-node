const Condominium = require("../models/Condominium");
const Apartment = require("../models/Apartment");
const db = require("../utils/db");

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

exports.createCondominium = async (event) => {
  try {
    await db.ensureConnection();
    const condominiumData = JSON.parse(event.body);
    const condominium = new Condominium(condominiumData);
    await condominium.save();
    return createResponse(201, condominium);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getCondominiums = async (event) => {
  try {
    await db.ensureConnection();
    const condominiums = await Condominium.find();
    return createResponse(200, condominiums);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getCondominium = async (event) => {
  try {
    await db.ensureConnection();
    const condominium = await Condominium.findById(event.pathParameters.id);
    if (!condominium) {
      return createResponse(404, { error: "Condomínio não encontrado" });
    }
    return createResponse(200, condominium);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updateCondominium = async (event) => {
  try {
    await db.ensureConnection();
    const condominium = await Condominium.findByIdAndUpdate(
      event.pathParameters.id,
      JSON.parse(event.body),
      { new: true }
    );
    if (!condominium) {
      return createResponse(404, { error: "Condomínio não encontrado" });
    }
    return createResponse(200, condominium);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deleteCondominium = async (event) => {
  try {
    await db.ensureConnection();
    const condominiumId = event.pathParameters.id;

    // Verificar se existem apartamentos associados
    const apartmentsCount = await Apartment.countDocuments({ condominium: condominiumId });
    if (apartmentsCount > 0) {
      return createResponse(400, { 
        error: "Não é possível excluir o condomínio pois existem apartamentos associados" 
      });
    }

    const condominium = await Condominium.findByIdAndDelete(condominiumId);
    if (!condominium) {
      return createResponse(404, { error: "Condomínio não encontrado" });
    }
    return createResponse(200, { message: "Condomínio removido com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getCondominiumApartments = async (event) => {
  try {
    await db.ensureConnection();
    const apartments = await Apartment.find({ condominium: event.pathParameters.id })
      .populate('owner', 'name email')
      .populate('condominium', 'name');
    
    return createResponse(200, apartments);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
}; 