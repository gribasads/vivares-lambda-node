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
    expiresAt.setMinutes(expiresAt.getMinutes() + 1000000000); // Código expira em 15 minutos

    // Verificar se o usuário já existe antes da operação
    const existingUser = await User.findOne({ email });
    const isNewUser = !existingUser;

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

    // Se é um usuário novo, criar apartamento automaticamente
    if (isNewUser) {
      // Verificar se o condomínio existe
      const condominiumId = '68506574fbbf67920ec15fff';
      const condominium = await Condominium.findById(condominiumId);
      
      if (!condominium) {
        console.error(`Condomínio com ID ${condominiumId} não encontrado`);
        throw new Error('Condomínio não encontrado');
      }

      // Verificar se o usuário já tem um apartamento (por segurança)
      const existingApartment = await Apartment.findOne({ owner: user._id });
      if (existingApartment) {
        console.log(`Usuário ${email} já possui apartamento: ${existingApartment._id}`);
      } else {
        // Gerar valores aleatórios para block e number
        const randomBlock = Math.floor(Math.random() * 10) + 1; // 1-10
        const randomNumber = Math.floor(Math.random() * 20) + 1; // 1-20
        
        // Criar apartamento automaticamente
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
