const express = require("express");
const { getProducts, getProductById } = require("../controllers/product.js");

const productRouter = express.Router();

// Products
productRouter.get("/products", getProducts);
productRouter.get("/products/:id", getProductById);

module.exports = productRouter;
