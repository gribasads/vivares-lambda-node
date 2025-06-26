const Book = require("../models/Books");
const { v4: uuidv4 } = require('uuid');
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

exports.createBook = async (event) => {
  try {
    await db.ensureConnection();
    const bookData = JSON.parse(event.body);
    
    // Gerar ID único automaticamente
    bookData.id = uuidv4();
    
    const book = new Book(bookData);
    await book.save();
    return createResponse(201, book);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getBooks = async (event) => {
  try {
    await db.ensureConnection();
    const books = await Book.find()
      .populate('userId');
    return createResponse(200, books);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getBook = async (event) => {
  try {
    await db.ensureConnection();
    const book = await Book.findById(event.pathParameters.id)
      .populate('userId');
    if (!book) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    return createResponse(200, book);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updateBook = async (event) => {
  try {
    await db.ensureConnection();
    const book = await Book.findByIdAndUpdate(
      event.pathParameters.id,
      JSON.parse(event.body),
      { new: true }
    ).populate('userId');
    
    if (!book) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    return createResponse(200, book);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deleteBook = async (event) => {
  try {
    await db.ensureConnection();
    const book = await Book.findByIdAndDelete(event.pathParameters.id);
    if (!book) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    return createResponse(200, { message: "Reserva removida com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updateBookStatus = async (event) => {
  try {
    await db.ensureConnection();
    const { status } = JSON.parse(event.body);
    const book = await Book.findByIdAndUpdate(
      event.pathParameters.id,
      { status },
      { new: true }
    ).populate('userId');
    
    if (!book) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    return createResponse(200, book);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getBooksByUserId = async (event) => {
  try {
    await db.ensureConnection();
    const userId = event.pathParameters.userId;
    
    // Buscar reservas do usuário
    const books = await Book.find({ userId })
      .populate('userId', 'name email');
    
    // Buscar os dados dos places para cada reserva
    const Place = require("../models/Places");
    const formattedBooks = await Promise.all(books.map(async (book) => {
      // Buscar o place pelo campo id
      const place = await Place.findOne({ id: book.placeId });
      
      return {
        placeName: place?.name || 'Local não encontrado',
        dateHour: book.dateHour,
        reason: book.reason,
        guests: book.guests,
        status: book.status
      };
    }));
    
    return createResponse(200, formattedBooks);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
}; 