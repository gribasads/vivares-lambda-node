const CodeService = require("../services/codeService");
const User = require("../models/User");
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

    if (user.authToken) {
      return createResponse(200, {
        token: user.authToken,
        user: {
          id: user._id,
          email: user.email
        }
      });
    }

    const token = jwt.sign(
      { userId: user._id },
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
        email: user.email
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
        email: user.email
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
