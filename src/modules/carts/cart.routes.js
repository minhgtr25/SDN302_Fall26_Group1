const express = require("express");
const cartController = require("./cart.controller.js");
const {
  validateAddToCart,
  validateUpdateQuantity,
} = require("./cart.validation.js");
const { auth } = require("../../common/middlewares/auth.js");
const { role } = require("../../common/middlewares/role.js");

const cartRouter = express.Router();
const customerOnly = [auth, role("CUSTOMER")];

// UC31 - Xem giỏ hàng
cartRouter.get("/cart", customerOnly, cartController.getCart);

// UC30 - Thêm sản phẩm vào giỏ hàng
cartRouter.post(
  "/cart/items",
  customerOnly,
  validateAddToCart,
  cartController.addToCart,
);
cartRouter.post(
  "/cart",
  customerOnly,
  validateAddToCart,
  cartController.addToCart,
);

// UC32 - Cập nhật số lượng
cartRouter.put(
  "/cart/items/:productId",
  customerOnly,
  validateUpdateQuantity,
  cartController.updateItemQuantity,
);
cartRouter.patch(
  "/cart/items/:productId",
  customerOnly,
  validateUpdateQuantity,
  cartController.updateItemQuantity,
);

// UC32 - Xóa khỏi giỏ hàng
cartRouter.delete(
  "/cart/items/:productId",
  customerOnly,
  cartController.removeItem,
);
cartRouter.delete("/cart", customerOnly, cartController.clearCart);

module.exports = cartRouter;
