const Book = require("../models/Books");
const Place = require("../models/Places");
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

const validateOperatingHours = (place, reservationDate) => {
  const reservationTime = new Date(reservationDate);
  const reservationHour = reservationTime.getHours();
  const reservationMinute = reservationTime.getMinutes();
  
  const [openHour, openMinute] = place.openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = place.closingTime.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  const reservationMinutes = reservationHour * 60 + reservationMinute;
  
  return reservationMinutes >= openMinutes && reservationMinutes <= closeMinutes;
};

const checkReservationConflicts = async (placeId, reservationDate, excludeBookId = null) => {
  const startOfDay = new Date(reservationDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(reservationDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    placeId,
    dateHour: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'approved'] }
  };
  
  if (excludeBookId) {
    query._id = { $ne: excludeBookId };
  }
  
  const existingBookings = await Book.find(query);
  return existingBookings;
};

exports.createBook = async (event) => {
  try {
    await db.ensureConnection();
    const bookData = JSON.parse(event.body);
    
    const place = await Place.findById(bookData.placeId);
    if (!place) {
      return createResponse(404, { error: "Local não encontrado" });
    }
    
    if (!validateOperatingHours(place, bookData.dateHour)) {
      return createResponse(400, { 
        error: `Horário fora do funcionamento. O local funciona das ${place.openingTime} às ${place.closingTime}` 
      });
    }
    
    const existingBookings = await checkReservationConflicts(bookData.placeId, bookData.dateHour);
    
    if (place.reservationType === 'single') {
      if (existingBookings.length > 0) {
        return createResponse(409, { 
          error: "Este local já possui uma reserva para este dia. Lugares de reserva única não permitem múltiplas reservas no mesmo dia." 
        });
      }
    } else if (place.reservationType === 'multiple') {
      const totalGuests = existingBookings.reduce((sum, booking) => sum + booking.guests.length, 0);
      const newGuests = bookData.guests ? bookData.guests.length : 0;
      
      if (totalGuests + newGuests > place.maxCapacity) {
        return createResponse(409, { 
          error: `Capacidade excedida. Capacidade máxima: ${place.maxCapacity} pessoas. Já reservado: ${totalGuests} pessoas.` 
        });
      }
      
      if (!place.reservationSettings.allowOverlap) {
        const reservationTime = new Date(bookData.dateHour);
        const timeSlotEnd = new Date(reservationTime.getTime() + (place.timeSlot * 60000));
        
        const hasOverlap = existingBookings.some(booking => {
          const bookingTime = new Date(booking.dateHour);
          const bookingEnd = new Date(bookingTime.getTime() + (place.timeSlot * 60000));
          
          return (reservationTime < bookingEnd && timeSlotEnd > bookingTime);
        });
        
        if (hasOverlap) {
          return createResponse(409, { 
            error: "Existe sobreposição de horários com outra reserva. Este local não permite sobreposições." 
          });
        }
      }
    }
    
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
    const book = await Book.findOne({ id: event.pathParameters.id })
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
    const updateData = JSON.parse(event.body);
    
    const existingBook = await Book.findOne({ id: event.pathParameters.id });
    if (!existingBook) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    
    if (updateData.dateHour) {
      const place = await Place.findById(existingBook.placeId);
      if (!place) {
        return createResponse(404, { error: "Local não encontrado" });
      }
      
      if (!validateOperatingHours(place, updateData.dateHour)) {
        return createResponse(400, { 
          error: `Horário fora do funcionamento. O local funciona das ${place.openingTime} às ${place.closingTime}` 
        });
      }
      
      const existingBookings = await checkReservationConflicts(existingBook.placeId, updateData.dateHour, existingBook._id);
      
      if (place.reservationType === 'single') {
        if (existingBookings.length > 0) {
          return createResponse(409, { 
            error: "Este local já possui uma reserva para este dia. Lugares de reserva única não permitem múltiplas reservas no mesmo dia." 
          });
        }
      } else if (place.reservationType === 'multiple') {
        const totalGuests = existingBookings.reduce((sum, booking) => sum + booking.guests.length, 0);
        const newGuests = updateData.guests ? updateData.guests.length : existingBook.guests.length;
        
        if (totalGuests + newGuests > place.maxCapacity) {
          return createResponse(409, { 
            error: `Capacidade excedida. Capacidade máxima: ${place.maxCapacity} pessoas. Já reservado: ${totalGuests} pessoas.` 
          });
        }
        
        if (!place.reservationSettings.allowOverlap) {
          const reservationTime = new Date(updateData.dateHour);
          const timeSlotEnd = new Date(reservationTime.getTime() + (place.timeSlot * 60000));
          
          const hasOverlap = existingBookings.some(booking => {
            const bookingTime = new Date(booking.dateHour);
            const bookingEnd = new Date(bookingTime.getTime() + (place.timeSlot * 60000));
            
            return (reservationTime < bookingEnd && timeSlotEnd > bookingTime);
          });
          
          if (hasOverlap) {
            return createResponse(409, { 
              error: "Existe sobreposição de horários com outra reserva. Este local não permite sobreposições." 
            });
          }
        }
      }
    }
    
    const book = await Book.findByIdAndUpdate(
      existingBook._id,
      updateData,
      { new: true }
    ).populate('userId');
    
    return createResponse(200, book);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deleteBook = async (event) => {
  try {
    await db.ensureConnection();
    const existingBook = await Book.findOne({ id: event.pathParameters.id });
    if (!existingBook) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    
    const book = await Book.findByIdAndDelete(existingBook._id);
    return createResponse(200, { message: "Reserva removida com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updateBookStatus = async (event) => {
  try {
    await db.ensureConnection();
    const { status } = JSON.parse(event.body);
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return createResponse(400, { 
        error: "Status inválido. Status válidos são: pending, approved, rejected" 
      });
    }
    
    const existingBook = await Book.findOne({ id: event.pathParameters.id });
    if (!existingBook) {
      return createResponse(404, { error: "Reserva não encontrada" });
    }
    
    const book = await Book.findByIdAndUpdate(
      existingBook._id,
      { status },
      { new: true }
    ).populate('userId', 'name email')
     .populate('placeId', 'name');
    
    const formattedBook = {
      _id: book._id,
      id: book.id,
      placeName: book.placeId?.name || 'Local não encontrado',
      placeId: book.placeId?._id,
      dateHour: book.dateHour,
      reason: book.reason,
      guests: book.guests,
      status: book.status,
      userName: book.userId?.name || 'Usuário não encontrado',
      userEmail: book.userId?.email,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
    
    return createResponse(200, {
      message: `Status da reserva atualizado para: ${status}`,
      book: formattedBook
    });
  } catch (error) {
    console.error('Erro ao atualizar status do book:', error);
    return createResponse(500, { error: error.message });
  }
};

exports.getBooksByUserId = async (event) => {
  try {
    await db.ensureConnection();
    const userId = event.pathParameters.userId;
    
    const books = await Book.find({ userId })
      .populate('userId', 'name email');
    
    const formattedBooks = await Promise.all(books.map(async (book) => {
      let place = await Place.findOne({ id: book.placeId });
      
      if (!place && book.placeId) {
        try {
          place = await Place.findById(book.placeId);
        } catch (error) {
        }
      }
      
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

exports.getBooksByCondominiumId = async (event) => {
  try {
    await db.ensureConnection();
    const condominiumId = event.pathParameters.condominiumId;
    
    const places = await Place.find({ condominium: condominiumId });
    
    if (!places || places.length === 0) {
      return createResponse(200, []);
    }
    
    const placeIds = places.map(place => place._id);
    
    const books = await Book.find({ placeId: { $in: placeIds } })
      .populate('userId', 'name email')
      .populate('placeId', 'name');
    
    const formattedBooks = books.map(book => ({
      _id: book._id,
      id: book.id,
      placeName: book.placeId?.name || 'Local não encontrado',
      placeId: book.placeId?._id,
      dateHour: book.dateHour,
      reason: book.reason,
      guests: book.guests,
      status: book.status,
      userName: book.userId?.name || 'Usuário não encontrado',
      userEmail: book.userId?.email,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    }));
    
    return createResponse(200, formattedBooks);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.checkPlaceAvailability = async (event) => {
  try {
    await db.ensureConnection();
    const { placeId, date } = event.queryStringParameters || {};
    
    if (!placeId || !date) {
      return createResponse(400, { error: "placeId e date são obrigatórios" });
    }
    
    const place = await Place.findById(placeId);
    if (!place) {
      return createResponse(404, { error: "Local não encontrado" });
    }
    
    const existingBookings = await checkReservationConflicts(placeId, date);
    
    let isAvailable = true;
    
    if (place.reservationType === 'single') {
      if (existingBookings.length > 0) {
        isAvailable = false;
      }
    } else if (place.reservationType === 'multiple') {
      const totalGuests = existingBookings.reduce((sum, booking) => sum + booking.guests.length, 0);
      const availableCapacity = place.maxCapacity - totalGuests;
      
      if (availableCapacity <= 0) {
        isAvailable = false;
      }
    }
    
    return createResponse(200, { available: isAvailable });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
}; 