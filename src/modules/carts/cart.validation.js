const mongoose = require("mongoose");
const AppError = require("../../common/errors/AppError.js");

const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    return next(new AppError(400, "productId không hợp lệ"));
  }

  const parsedQty = quantity === undefined ? 1 : Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty < 1) {
    return next(new AppError(400, "Số lượng phải là số nguyên lớn hơn hoặc bằng 1"));
  }

  req.body = {
    productId: String(productId),
    quantity: parsedQty,
  };
  next();
};

const validateUpdateQuantity = (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (productId && !mongoose.isValidObjectId(productId)) {
    return next(new AppError(400, "productId không hợp lệ"));
  }

  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty < 1) {
    return next(new AppError(400, "Số lượng phải là số nguyên lớn hơn hoặc bằng 1"));
  }

  req.body = {
    quantity: parsedQty,
  };
  next();
};

module.exports = {
  validateAddToCart,
  validateUpdateQuantity,
};
