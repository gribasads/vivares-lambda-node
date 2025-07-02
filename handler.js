const AuthController = require("./controllers/AuthController");
const PlaceController = require("./controllers/PlaceController");
const BookController = require("./controllers/BookController");
const PostController = require("./controllers/PostController");
const CondominiumController = require("./controllers/CondominiumController");
const ApartmentController = require("./controllers/ApartmentController");

// Auth Handlers
module.exports.requestCode = async (event) => {
  return await AuthController.requestCode(event);
};

module.exports.verifyCode = async (event) => {
  return await AuthController.verifyCode(event);
};

module.exports.updateUserName = async (event) => {
  return await AuthController.updateUserName(event);
};

module.exports.getUsers = async (event) => {
  return await AuthController.getUsers(event);
};

module.exports.getUser = async (event) => {
  return await AuthController.getUser(event);
};

module.exports.getUserProfile = async (event) => {
  return await AuthController.getUserProfile(event);
};

module.exports.toggleUserAdmin = async (event) => {
  return await AuthController.toggleUserAdmin(event);
};

// Place Handlers
module.exports.createPlace = async (event) => {
  return await PlaceController.createPlace(event);
};

module.exports.getPlaces = async (event) => {
  return await PlaceController.getPlaces(event);
};

module.exports.getPlacesByCondominium = async (event) => {
  return await PlaceController.getPlacesByCondominium(event);
};

module.exports.getPlace = async (event) => {
  return await PlaceController.getPlace(event);
};

module.exports.updatePlace = async (event) => {
  return await PlaceController.updatePlace(event);
};

module.exports.deletePlace = async (event) => {
  return await PlaceController.deletePlace(event);
};

module.exports.uploadPlaceImage = async (event) => {
  return await PlaceController.uploadPlaceImage(event);
};

// Book Handlers
module.exports.createBook = async (event) => {
  return await BookController.createBook(event);
};

module.exports.getBooks = async (event) => {
  return await BookController.getBooks(event);
};

module.exports.getBook = async (event) => {
  return await BookController.getBook(event);
};

module.exports.getBooksByUserId = async (event) => {
  return await BookController.getBooksByUserId(event);
};

module.exports.getBooksByCondominiumId = async (event) => {
  return await BookController.getBooksByCondominiumId(event);
};

module.exports.updateBook = async (event) => {
  return await BookController.updateBook(event);
};

module.exports.deleteBook = async (event) => {
  return await BookController.deleteBook(event);
};

module.exports.updateBookStatus = async (event) => {
  return await BookController.updateBookStatus(event);
};

// Post Handlers
module.exports.uploadImage = async (event) => {
  return await PostController.uploadImage(event);
};

module.exports.createPost = async (event) => {
  return await PostController.createPost(event);
};

module.exports.getPosts = async (event) => {
  return await PostController.getPosts(event);
};

module.exports.getPost = async (event) => {
  return await PostController.getPost(event);
};

module.exports.updatePost = async (event) => {
  return await PostController.updatePost(event);
};

module.exports.deletePost = async (event) => {
  return await PostController.deletePost(event);
};

module.exports.uploadPostImage = async (event) => {
  return await PostController.uploadPostImage(event);
};

// Condominium Handlers
module.exports.createCondominium = async (event) => {
  return await CondominiumController.createCondominium(event);
};

module.exports.getCondominiums = async (event) => {
  return await CondominiumController.getCondominiums(event);
};

module.exports.getCondominium = async (event) => {
  return await CondominiumController.getCondominium(event);
};

module.exports.updateCondominium = async (event) => {
  return await CondominiumController.updateCondominium(event);
};

module.exports.deleteCondominium = async (event) => {
  return await CondominiumController.deleteCondominium(event);
};

module.exports.getCondominiumApartments = async (event) => {
  return await CondominiumController.getCondominiumApartments(event);
};

// Apartment Handlers
module.exports.createApartment = async (event) => {
  return await ApartmentController.createApartment(event);
};

module.exports.getApartments = async (event) => {
  return await ApartmentController.getApartments(event);
};

module.exports.getApartment = async (event) => {
  return await ApartmentController.getApartment(event);
};

module.exports.updateApartment = async (event) => {
  return await ApartmentController.updateApartment(event);
};

module.exports.deleteApartment = async (event) => {
  return await ApartmentController.deleteApartment(event);
};

module.exports.getUserApartments = async (event) => {
  return await ApartmentController.getUserApartments(event);
};
