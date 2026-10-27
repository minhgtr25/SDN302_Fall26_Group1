const orderService = require("./order.service.js");
const asyncHandler = require("../../common/utils/asyncHandler.js");
const { success, paginated } = require("../../common/utils/response.js");

// UC33: Đặt hàng (checkout)
const checkout = asyncHandler(async (req, res) => {
  const result = await orderService.checkout(req.user, req.body);
  success(res, result, "Đặt hàng thành công", 201);
});

// UC34: Thanh toán đơn hàng
const payOrder = asyncHandler(async (req, res) => {
  const order = await orderService.payOrder(req.user._id, req.params.id);
  success(res, order, "Thanh toán đơn hàng thành công");
});

// UC35: Xem lịch sử đơn hàng
const getMyOrders = asyncHandler(async (req, res) => {
  const { items, pagination } = await orderService.getMyOrders(
    req.user._id,
    req.query,
  );
  paginated(res, items, pagination);
});

// UC36: Xem chi tiết & theo dõi đơn hàng
const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrderById(req.user._id, req.params.id);
  success(res, order);
});

// UC37: Khách hủy đơn hàng
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id);
  success(res, order, "Hủy đơn hàng thành công");
});

module.exports = {
  checkout,
  payOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
};
