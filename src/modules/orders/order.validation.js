const mongoose = require("mongoose");
const AppError = require("../../common/errors/AppError.js");

const PAYMENT_METHODS = ["COD", "ONLINE"];
const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED"];

const validateCheckout = (req, res, next) => {
  const { shippingAddress, phone, paymentMethod, itemProductIds } = req.body;

  if (typeof shippingAddress !== "string" || !shippingAddress.trim()) {
    return next(new AppError(400, "Địa chỉ giao hàng (shippingAddress) là bắt buộc"));
  }
  if (shippingAddress.trim().length > 500) {
    return next(new AppError(400, "Địa chỉ giao hàng tối đa 500 ký tự"));
  }

  const finalPhone =
    phone !== undefined && String(phone).trim()
      ? String(phone).trim()
      : req.user?.phone || "";

  if (!finalPhone) {
    return next(
      new AppError(
        400,
        "Số điện thoại nhận hàng (phone) là bắt buộc và chưa được cập nhật trong tài khoản",
      ),
    );
  }

  let finalPaymentMethod = paymentMethod ? String(paymentMethod).toUpperCase() : "COD";
  if (!PAYMENT_METHODS.includes(finalPaymentMethod)) {
    return next(new AppError(400, "Phương thức thanh toán phải là COD hoặc ONLINE"));
  }

  let finalProductIds;
  if (itemProductIds !== undefined) {
    if (!Array.isArray(itemProductIds)) {
      return next(new AppError(400, "itemProductIds phải là mảng id sản phẩm"));
    }
    for (const id of itemProductIds) {
      if (!mongoose.isValidObjectId(id)) {
        return next(new AppError(400, `productId không hợp lệ: ${id}`));
      }
    }
    finalProductIds = itemProductIds.map(String);
  }

  req.body = {
    shippingAddress: shippingAddress.trim(),
    phone: finalPhone,
    paymentMethod: finalPaymentMethod,
    itemProductIds: finalProductIds,
  };

  next();
};

const validateOrderQuery = (req, res, next) => {
  const status = req.query.orderStatus || req.query.status;
  if (status) {
    const upper = String(status).toUpperCase();
    if (!ORDER_STATUSES.includes(upper)) {
      return next(
        new AppError(
          400,
          `Trạng thái đơn hàng không hợp lệ. Cho phép: ${ORDER_STATUSES.join(", ")}`,
        ),
      );
    }
    req.query.orderStatus = upper;
  }

  if (req.query.paymentStatus) {
    const upper = String(req.query.paymentStatus).toUpperCase();
    if (!PAYMENT_STATUSES.includes(upper)) {
      return next(
        new AppError(
          400,
          `Trạng thái thanh toán không hợp lệ. Cho phép: ${PAYMENT_STATUSES.join(", ")}`,
        ),
      );
    }
    req.query.paymentStatus = upper;
  }

  next();
};

module.exports = {
  validateCheckout,
  validateOrderQuery,
};
