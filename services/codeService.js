const User = require("../models/User");
const Apartment = require("../models/Apartment");
const Condominium = require("../models/Condominium");
const db = require("../utils/db");
const { sendVerificationCode } = require("./mailService");

exports.generateCode = async (email) => {
  try {
    await db.ensureConnection();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1000000000);

    const existingUser = await User.findOne({ email });
    const isNewUser = !existingUser;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name: email.split('@')[0],
          verificationCode: {
            code,
            expiresAt
          }
        }
      },
      { upsert: true, new: true }
    );

    if (isNewUser) {
      const condominiumId = '68506574fbbf67920ec15fff';
      const condominium = await Condominium.findById(condominiumId);
      
      if (!condominium) {
        console.error(`Condomínio com ID ${condominiumId} não encontrado`);
        throw new Error('Condomínio não encontrado');
      }

      const existingApartment = await Apartment.findOne({ owner: user._id });
      if (existingApartment) {
        console.log(`Usuário ${email} já possui apartamento: ${existingApartment._id}`);
      } else {
        const randomBlock = Math.floor(Math.random() * 10) + 1;
        const randomNumber = Math.floor(Math.random() * 20) + 1;
        
        const apartment = new Apartment({
          number: randomNumber.toString(),
          block: randomBlock.toString(),
          condominium: condominiumId,
          owner: user._id
        });
        
        await apartment.save();
        console.log(`Apartamento criado automaticamente para usuário ${email}: Bloco ${randomBlock}, Número ${randomNumber}`);
      }
    }

    await sendVerificationCode(email, code);
    return { message: "Código gerado com sucesso", code };
  } catch (error) {
    console.error('Erro ao gerar código:', error);
    throw error;
  }
};
