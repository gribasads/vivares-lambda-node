const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationCode = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Código de Verificação',
        html: `
            <h1>Seu código de verificação</h1>
            <p>Use o código abaixo para verificar sua conta:</p>
            <h2 style="color: #4CAF50; font-size: 24px;">${code}</h2>
            <p>Este código expira em 10 minutos.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return false;
    }
};

module.exports = {
    sendVerificationCode
}; 