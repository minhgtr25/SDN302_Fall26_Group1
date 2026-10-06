const express = require("express");
const productRouter = require("./product.js");
const router = express.Router();
router.use("/", productRouter);
module.exports = router;
