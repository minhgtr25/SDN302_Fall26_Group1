const express = require("express");
const orderController = require("./order.controller.js");
const {
  validateCheckout,
  validateOrderQuery,
} = require("./order.validation.js");
const { auth } = require("../../common/middlewares/auth.js");
const { role } = require("../../common/middlewares/role.js");

const orderRouter = express.Router();
const customerOnly = [auth, role("CUSTOMER")];

// UC33 - Đặt hàng (checkout)
orderRouter.post(
  "/orders/checkout",
  customerOnly,
  validateCheckout,
  orderController.checkout,
);
orderRouter.post(
  "/orders",
  customerOnly,
  validateCheckout,
  orderController.checkout,
);

// UC34 - Thanh toán đơn hàng (giả lập online)
orderRouter.post("/orders/:id/pay", customerOnly, orderController.payOrder);
orderRouter.patch("/orders/:id/pay", customerOnly, orderController.payOrder);

// UC35 - Xem lịch sử đơn hàng
orderRouter.get(
  "/orders",
  customerOnly,
  validateOrderQuery,
  orderController.getMyOrders,
);

// UC36 - Xem chi tiết & theo dõi đơn hàng
orderRouter.get("/orders/:id", customerOnly, orderController.getMyOrderById);

// UC37 - Khách hủy đơn hàng
orderRouter.patch(
  "/orders/:id/cancel",
  customerOnly,
  orderController.cancelOrder,
);
orderRouter.post(
  "/orders/:id/cancel",
  customerOnly,
  orderController.cancelOrder,
);

module.exports = orderRouter;
