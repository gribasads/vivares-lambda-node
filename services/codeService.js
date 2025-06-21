const User = require("../models/User");
const db = require("../utils/db");
const { sendVerificationCode } = require("./mailService");

exports.generateCode = async (email) => {
  try {
    await db.ensureConnection();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1000000000); // Código expira em 15 minutos

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name: email.split('@')[0], // Usando a parte antes do @ como nome inicial
          verificationCode: {
            code,
            expiresAt
          }
        }
      },
      { upsert: true, new: true }
    );
    await sendVerificationCode(email, code);
    return { message: "Código gerado com sucesso", code };
  } catch (error) {
    console.error('Erro ao gerar código:', error);
    throw error;
  }
};
