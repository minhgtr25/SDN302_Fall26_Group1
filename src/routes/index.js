const express = require("express");
const productRouter = require("./product.js");
const categoryRouter = require("./category.js");
const router = express.Router();
router.use("/", productRouter);
router.use("/", categoryRouter);
module.exports = router;
