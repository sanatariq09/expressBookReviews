const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

/* ------------------------------------------------------------------
   Core routes (read directly from booksdb.js)
------------------------------------------------------------------- */

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the list of all books
public_users.get("/", (req, res) => {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details by ISBN
public_users.get("/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book, null, 4));
});

// Get books by author
public_users.get("/author/:author", (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found for this author" });
  return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
});

// Get books by title
public_users.get("/title/:title", (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found with this title" });
  return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
});

// Get book reviews
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

/* ------------------------------------------------------------------
   Task 11: Axios client functions (Promise callbacks + async/await)
------------------------------------------------------------------- */

// Get all books - async/await with Axios
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Get book by ISBN - Promise callbacks with Axios
const getBookByISBN = (isbn) => {
  return axios
    .get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data);
};

// Get books by author - async/await with Axios
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Get books by title - Promise callbacks with Axios
const getBooksByTitle = (title) => {
  return axios
    .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data);
};

const sendError = (res, err) => {
  const status = err.response ? err.response.status : 500;
  const message = err.response ? err.response.data : { message: err.message };
  return res.status(status).json(message);
};

public_users.get("/async/books", async (req, res) => {
  try {
    return res.status(200).json(await getAllBooks());
  } catch (err) {
    return sendError(res, err);
  }
});

public_users.get("/async/isbn/:isbn", (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((data) => res.status(200).json(data))
    .catch((err) => sendError(res, err));
});

public_users.get("/async/author/:author", async (req, res) => {
  try {
    return res.status(200).json(await getBooksByAuthor(req.params.author));
  } catch (err) {
    return sendError(res, err);
  }
});

public_users.get("/async/title/:title", (req, res) => {
  getBooksByTitle(req.params.title)
    .then((data) => res.status(200).json(data))
    .catch((err) => sendError(res, err));
});

module.exports.general = public_users;
