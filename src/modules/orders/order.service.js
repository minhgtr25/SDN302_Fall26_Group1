const Order = require("./order.model.js");
const Cart = require("../carts/cart.model.js");
const Product = require("../products/product.model.js");
const Shop = require("../shops/shop.model.js");
const Notification = require("../notifications/notification.model.js");
const AppError = require("../../common/errors/AppError.js");
const { assertObjectId, getPagination } = require("../../common/utils/query.js");

// UC33: Đặt hàng (checkout)
const checkout = async (
  user,
  { shippingAddress, phone, paymentMethod = "COD", itemProductIds },
) => {
  const customerId = user._id;

  const cart = await Cart.findOne({ customerId });
  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Giỏ hàng trống");
  }

  // Lọc sản phẩm cần thanh toán (nếu truyền itemProductIds thì chỉ thanh toán các món đó)
  let selectedCartItems = cart.items;
  if (itemProductIds && itemProductIds.length > 0) {
    const idSet = new Set(itemProductIds.map(String));
    selectedCartItems = cart.items.filter((item) =>
      idSet.has(item.productId.toString()),
    );
  }

  if (selectedCartItems.length === 0) {
    throw new AppError(400, "Không có sản phẩm nào hợp lệ để đặt hàng");
  }

  // Load sản phẩm & shop để kiểm tra tồn kho, trạng thái shop
  const productIds = selectedCartItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const shopIds = [...new Set(products.map((p) => p.shopId.toString()))];
  const shops = await Shop.find({ _id: { $in: shopIds } });
  const shopMap = new Map(shops.map((s) => [s._id.toString(), s]));

  // Kiểm tra từng sản phẩm
  for (const item of selectedCartItems) {
    const prod = productMap.get(item.productId.toString());
    if (!prod) {
      throw new AppError(404, "Có sản phẩm trong giỏ không còn tồn tại");
    }

    if (prod.productStatus !== "AVAILABLE") {
      throw new AppError(
        400,
        `Sản phẩm "${prod.productName}" hiện không khả dụng`,
      );
    }

    const shop = shopMap.get(prod.shopId.toString());
    if (!shop || shop.approvalStatus !== "APPROVED" || shop.operationStatus !== "OPEN") {
      throw new AppError(
        400,
        `Cửa hàng "${shop?.shopName || "Cửa hàng"}" hiện đóng cửa hoặc chưa được phê duyệt`,
      );
    }

    if (prod.stockQuantity < item.quantity) {
      throw new AppError(
        400,
        `Sản phẩm "${prod.productName}" không đủ tồn kho (chỉ còn ${prod.stockQuantity}, bạn cần ${item.quantity})`,
      );
    }
  }

  // Tách đơn theo shop
  const shopOrderMap = new Map();
  for (const item of selectedCartItems) {
    const prod = productMap.get(item.productId.toString());
    const shopIdStr = prod.shopId.toString();

    if (!shopOrderMap.has(shopIdStr)) {
      shopOrderMap.set(shopIdStr, {
        shop: shopMap.get(shopIdStr),
        items: [],
      });
    }

    const subtotal = prod.price * item.quantity;
    shopOrderMap.get(shopIdStr).items.push({
      productId: prod._id,
      productName: prod.productName, // chụp productName
      price: prod.price, // chụp price
      quantity: item.quantity,
      subtotal,
    });
  }

  const createdOrders = [];

  // Tạo đơn hàng cho từng shop, trừ tồn kho và gửi thông báo
  for (const [shopIdStr, data] of shopOrderMap.entries()) {
    const totalAmount = data.items.reduce((sum, it) => sum + it.subtotal, 0);

    const order = new Order({
      customerId,
      shopId: data.shop._id,
      items: data.items,
      shippingAddress,
      phone,
      paymentMethod,
      totalAmount,
      orderStatus: "PENDING",
      paymentStatus: "UNPAID",
    });

    await order.save();
    createdOrders.push(order);

    // Trừ tồn kho
    for (const item of data.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    // Báo đơn mới cho chủ shop
    if (data.shop?.ownerId) {
      await Notification.create({
        receiverId: data.shop.ownerId,
        title: "Đơn hàng mới",
        message: `Có đơn hàng mới #${order._id.toString().slice(-4)} đang chờ xác nhận.`,
        type: "ORDER",
        isRead: false,
      });
    }
  }

  // Xóa các sản phẩm đã đặt khỏi giỏ hàng
  const checkedProductIds = new Set(
    selectedCartItems.map((item) => item.productId.toString()),
  );
  cart.items = cart.items.filter(
    (item) => !checkedProductIds.has(item.productId.toString()),
  );
  await cart.save();

  return {
    orders: createdOrders,
    totalOrders: createdOrders.length,
  };
};

// UC34: Thanh toán đơn hàng
const payOrder = async (customerId, orderId) => {
  assertObjectId(orderId, "Mã đơn hàng");

  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại");
  }

  if (order.orderStatus === "CANCELLED") {
    throw new AppError(400, "Đơn hàng đã bị hủy, không thể thanh toán");
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError(400, "Đơn hàng đã được thanh toán");
  }

  if (order.paymentMethod === "COD") {
    throw new AppError(
      400,
      "Đơn hàng thanh toán khi nhận hàng (COD) sẽ tự động chuyển sang PAID khi giao hàng thành công",
    );
  }

  if (order.paymentMethod === "ONLINE") {
    order.paymentStatus = "PAID";
    await order.save();

    // Thông báo cho khách hàng
    await Notification.create({
      receiverId: customerId,
      title: "Thanh toán thành công",
      message: `Đơn hàng #${order._id.toString().slice(-4)} đã thanh toán trực tuyến thành công.`,
      type: "ORDER",
      isRead: false,
    });
  }

  return order;
};

// UC35: Xem lịch sử đơn hàng
const getMyOrders = async (customerId, query) => {
  const filter = { customerId };

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  const { page, limit, skip } = getPagination(query);

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("shopId", "shopName logoUrl address phone"),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total },
  };
};

// UC36: Xem chi tiết & theo dõi đơn hàng
const getMyOrderById = async (customerId, orderId) => {
  assertObjectId(orderId, "Mã đơn hàng");

  const order = await Order.findOne({ _id: orderId, customerId })
    .populate("shopId", "shopName logoUrl address phone")
    .populate("items.productId", "productName images price categoryId description");

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại");
  }

  return order;
};

// UC37: Khách hủy đơn hàng
const cancelOrder = async (customerId, orderId) => {
  assertObjectId(orderId, "Mã đơn hàng");

  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại");
  }

  if (order.orderStatus !== "PENDING") {
    throw new AppError(
      400,
      "Chỉ có thể hủy đơn hàng khi đơn còn ở trạng thái PENDING",
    );
  }

  order.orderStatus = "CANCELLED";
  if (order.paymentStatus === "PAID") {
    order.paymentStatus = "REFUNDED";
  }

  // Hoàn lại tồn kho cho các sản phẩm
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
    });
  }

  await order.save();

  // Báo hủy cho chủ shop
  const shop = await Shop.findById(order.shopId);
  if (shop?.ownerId) {
    await Notification.create({
      receiverId: shop.ownerId,
      title: "Đơn hàng đã hủy",
      message: `Đơn hàng #${order._id.toString().slice(-4)} đã bị khách hàng hủy.`,
      type: "ORDER",
      isRead: false,
    });
  }

  // Thông báo xác nhận cho khách hàng
  const refundNote =
    order.paymentStatus === "REFUNDED" ? ", tiền sẽ được hoàn lại." : ".";
  await Notification.create({
    receiverId: customerId,
    title: "Đơn hàng đã hủy",
    message: `Đơn hàng #${order._id.toString().slice(-4)} đã bị hủy${refundNote}`,
    type: "ORDER",
    isRead: false,
  });

  return order;
};

module.exports = {
  checkout,
  payOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
};
