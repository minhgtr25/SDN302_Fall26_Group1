const cartService = require("./cart.service.js");
const asyncHandler = require("../../common/utils/asyncHandler.js");
const { success } = require("../../common/utils/response.js");

// UC30: Thêm sản phẩm vào giỏ hàng
const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);
  success(res, cart, "Thêm sản phẩm vào giỏ hàng thành công", 200);
});

// UC31: Xem giỏ hàng
const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  success(res, cart);
});

// UC32: Cập nhật số lượng sản phẩm trong giỏ
const updateItemQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(
    req.user._id,
    req.params.productId,
    req.body.quantity,
  );
  success(res, cart, "Cập nhật số lượng thành công");
});

// UC32: Xóa sản phẩm khỏi giỏ hàng
const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.productId);
  success(res, cart, "Xóa sản phẩm khỏi giỏ hàng thành công");
});

// Xóa toàn bộ giỏ hàng
const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  success(res, cart, "Đã làm trống giỏ hàng");
});

module.exports = {
  addToCart,
  getCart,
  updateItemQuantity,
  removeItem,
  clearCart,
};
