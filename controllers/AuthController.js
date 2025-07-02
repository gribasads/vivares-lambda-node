const CodeService = require("../services/codeService");
const User = require("../models/User");
const Apartment = require("../models/Apartment");
const Condominium = require("../models/Condominium");
const jwt = require("jsonwebtoken");
const db = require("../utils/db");

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.STAGE === 'local' ? 'http://localhost:3001' : 'https://vivares-web.vercel.app',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Token,token,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
};

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

exports.requestCode = async (event) => {
  try {
    await db.ensureConnection();
    const { email } = JSON.parse(event.body);
    if (!email) {
      return createResponse(400, { error: "Email é obrigatório" });
    }

    const result = await CodeService.generateCode(email);
    return createResponse(200, result);
  } catch (error) {
    console.error('Erro em requestCode:', error);
    return createResponse(500, { error: error.message });
  }
};

exports.verifyCode = async (event) => {
  try {
    console.log('Iniciando verifyCode...');
    await db.ensureConnection();
    console.log('Conexão com banco estabelecida');

    const { email, code } = JSON.parse(event.body);
    console.log('Dados recebidos:', { email, code });

    if (!email || !code) {
      return createResponse(400, { error: "Email e código são obrigatórios" });
    }

    console.log('Buscando usuário...');
    const user = await User.findOne({ email }).exec();
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
    
    if (!user) {
      return createResponse(404, { error: "Usuário não encontrado" });
    }

    if (!user.verificationCode || 
        user.verificationCode.code !== code || 
        user.verificationCode.expiresAt < new Date()) {
      return createResponse(400, { error: "Código inválido ou expirado" });
    }

    // Buscar apartamento do usuário
    const apartment = await Apartment.findOne({ owner: user._id })
      .populate('condominium')
      .exec();

    // Preparar payload do JWT com dados necessários
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    };

    if (apartment) {
      tokenPayload.apartmentId = apartment._id;
      tokenPayload.condominiumId = apartment.condominium._id;
      tokenPayload.apartmentNumber = apartment.number;
      tokenPayload.condominiumName = apartment.condominium.name;
    }

    if (user.authToken) {
      // Verificar se o token atual ainda é válido
      try {
        const decoded = jwt.verify(user.authToken, process.env.JWT_SECRET);
        
        // Se o token for válido, usar os dados dele diretamente
        return createResponse(200, {
          token: user.authToken,
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            isAdmin: user.isAdmin,
            apartmentId: decoded.apartmentId,
            condominiumId: decoded.condominiumId,
            apartmentNumber: decoded.apartmentNumber,
            condominiumName: decoded.condominiumName
          }
        });
      } catch (error) {
        // Token expirado ou inválido, gerar novo
        console.log('Token expirado ou inválido, gerando novo...');
      }
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'seu_segredo_jwt',
      { expiresIn: "100y" }
    );

    user.isVerified = true;
    user.authToken = token;
    user.verificationCode = undefined;
    await user.save();

    return createResponse(200, {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        apartmentId: apartment?._id,
        condominiumId: apartment?.condominium?._id,
        apartmentNumber: apartment?.number,
        condominiumName: apartment?.condominium?.name
      }
    });
  } catch (error) {
    console.error('Erro em verifyCode:', error);
    console.error('Stack trace:', error.stack);
    return createResponse(500, { 
      error: error.message,
      details: error.stack
    });
  }
};

exports.updateUserName = async (event) => {
  try {
    const { email, name } = JSON.parse(event.body);

    if (!email || !name) {
      return createResponse(400, { error: "Email e nome são obrigatórios" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return createResponse(404, { error: "Usuário não encontrado" });
    }

    user.name = name;
    await user.save();

    return createResponse(200, {
      message: "Nome atualizado com sucesso",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getUsers = async (event) => {
  try {
    console.log('Iniciando getUsers...');
    await db.ensureConnection();
    console.log('Conexão com banco de dados estabelecida');

    console.log('Buscando usuários...');
    const users = await User.find()
      .select('-verificationCode -authToken')
      .lean()
      .exec();
    
    console.log(`Encontrados ${users.length} usuários`);
    
    return createResponse(200, users);
  } catch (error) {
    console.error('Erro em getUsers:', error);
    console.error('Stack trace:', error.stack);
    
    return createResponse(500, { 
      error: error.message,
      details: error.stack
    });
  }
};

exports.getUser = async (event) => {
  try {
    const userId = event.pathParameters.id;
    const user = await User.findById(userId);
    
    if (user) {
      return createResponse(200, user);
    } else {
      return createResponse(404, { error: "Usuário não encontrado" });
    }
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getUserProfile = async (event) => {
  try {
    await db.ensureConnection();
    
    // Extrair token do header Authorization
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(401, { error: "Token de autorização não fornecido" });
    }

    const token = authHeader.substring(7);
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt');
    
    // Se o token já contém os dados necessários, usar diretamente
    if (decoded.apartmentId && decoded.condominiumId) {
      const userProfile = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        isAdmin: decoded.isAdmin,
        apartmentId: decoded.apartmentId,
        condominiumId: decoded.condominiumId,
        apartmentNumber: decoded.apartmentNumber,
        condominiumName: decoded.condominiumName
      };
      
      return createResponse(200, userProfile);
    }
    
    // Se o token não contém dados completos, buscar no banco
    const user = await User.findById(decoded.userId).exec();
    if (!user) {
      return createResponse(404, { error: "Usuário não encontrado" });
    }

    // Buscar apartamento e condomínio
    const apartment = await Apartment.findOne({ owner: user._id })
      .populate('condominium')
      .exec();

    const userProfile = {
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      apartmentId: apartment?._id,
      condominiumId: apartment?.condominium?._id,
      apartmentNumber: apartment?.number,
      condominiumName: apartment?.condominium?.name,
      condominiumAddress: apartment?.condominium?.address
    };

    return createResponse(200, userProfile);
  } catch (error) {
    console.error('Erro em getUserProfile:', error);
    return createResponse(500, { error: error.message });
  }
};

exports.toggleUserAdmin = async (event) => {
  try {
    await db.ensureConnection();
    
    // ID do usuário que terá o status alterado
    const targetUserId = event.pathParameters.id;
    
    // Buscar o usuário alvo
    const targetUser = await User.findById(targetUserId).exec();
    if (!targetUser) {
      return createResponse(404, { error: "Usuário não encontrado" });
    }

    // Alternar o status isAdmin
    targetUser.isAdmin = !targetUser.isAdmin;
    await targetUser.save();

    return createResponse(200, {
      isAdmin: targetUser.isAdmin,
      message: `Status de administrador ${targetUser.isAdmin ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (error) {
    console.error('Erro em toggleUserAdmin:', error);
    return createResponse(500, { error: error.message });
  }
};
