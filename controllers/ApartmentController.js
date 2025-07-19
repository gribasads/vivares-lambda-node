const Apartment = require("../models/Apartment");
const Condominium = require("../models/Condominium");
const User = require("../models/User");
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

exports.createApartment = async (event) => {
  try {
    await db.ensureConnection();
    const apartmentData = JSON.parse(event.body);

    const condominium = await Condominium.findById(apartmentData.condominium);
    if (!condominium) {
      return createResponse(404, { error: "Condomínio não encontrado" });
    }

    if (apartmentData.owner) {
      const owner = await User.findById(apartmentData.owner);
      if (!owner) {
        return createResponse(404, { error: "Usuário não encontrado" });
      }
    }

    const apartment = new Apartment(apartmentData);
    await apartment.save();
    
    const populatedApartment = await Apartment.findById(apartment._id)
      .populate('condominium', 'name')
      .populate('owner', 'name email');

    return createResponse(201, populatedApartment);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getApartments = async (event) => {
  try {
    await db.ensureConnection();
    const apartments = await Apartment.find()
      .populate('condominium', 'name')
      .populate('owner', 'name email');
    return createResponse(200, apartments);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getApartment = async (event) => {
  try {
    await db.ensureConnection();
    const apartment = await Apartment.findById(event.pathParameters.id)
      .populate('condominium', 'name')
      .populate('owner', 'name email');
    
    if (!apartment) {
      return createResponse(404, { error: "Apartamento não encontrado" });
    }
    return createResponse(200, apartment);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updateApartment = async (event) => {
  try {
    await db.ensureConnection();
    const apartmentData = JSON.parse(event.body);

    if (apartmentData.condominium) {
      const condominium = await Condominium.findById(apartmentData.condominium);
      if (!condominium) {
        return createResponse(404, { error: "Condomínio não encontrado" });
      }
    }

    if (apartmentData.owner) {
      const owner = await User.findById(apartmentData.owner);
      if (!owner) {
        return createResponse(404, { error: "Usuário não encontrado" });
      }
    }

    const apartment = await Apartment.findByIdAndUpdate(
      event.pathParameters.id,
      apartmentData,
      { new: true }
    ).populate('condominium', 'name').populate('owner', 'name email');
    
    if (!apartment) {
      return createResponse(404, { error: "Apartamento não encontrado" });
    }
    return createResponse(200, apartment);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deleteApartment = async (event) => {
  try {
    await db.ensureConnection();
    const apartment = await Apartment.findByIdAndDelete(event.pathParameters.id);
    if (!apartment) {
      return createResponse(404, { error: "Apartamento não encontrado" });
    }
    return createResponse(200, { message: "Apartamento removido com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getUserApartments = async (event) => {
  try {
    await db.ensureConnection();
    const apartments = await Apartment.find({ owner: event.pathParameters.userId })
      .populate('condominium', 'name');
    return createResponse(200, apartments);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
}; 