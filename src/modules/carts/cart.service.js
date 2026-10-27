const Cart = require("./cart.model.js");
const Product = require("../products/product.model.js");
const Shop = require("../shops/shop.model.js");
const AppError = require("../../common/errors/AppError.js");
const { assertObjectId } = require("../../common/utils/query.js");

// UC30: Thêm sản phẩm vào giỏ hàng
const addToCart = async (customerId, { productId, quantity = 1 }) => {
  assertObjectId(productId, "productId");

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại");
  }

  if (product.productStatus !== "AVAILABLE") {
    throw new AppError(400, "Sản phẩm hiện không khả dụng");
  }

  const shop = await Shop.findById(product.shopId);
  if (!shop || shop.approvalStatus !== "APPROVED" || shop.operationStatus !== "OPEN") {
    throw new AppError(400, "Cửa hàng hiện đang đóng cửa hoặc chưa được phê duyệt");
  }

  let cart = await Cart.findOne({ customerId });
  if (!cart) {
    cart = new Cart({ customerId, items: [] });
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  const currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
  const newTotalQty = currentQty + quantity;

  if (newTotalQty > product.stockQuantity) {
    throw new AppError(
      400,
      `Số lượng yêu cầu vượt quá tồn kho hiện có (tồn kho: ${product.stockQuantity}, hiện có trong giỏ: ${currentQty})`,
    );
  }

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = newTotalQty;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return getCart(customerId);
};

// UC31: Xem giỏ hàng
const getCart = async (customerId) => {
  let cart = await Cart.findOne({ customerId }).populate({
    path: "items.productId",
    populate: {
      path: "shopId",
      select: "shopName logoUrl address phone approvalStatus operationStatus",
    },
  });

  if (!cart) {
    return {
      customerId,
      items: [],
      shops: [],
      totalAmount: 0,
      totalItems: 0,
    };
  }

  const shopMap = new Map();
  const formattedItems = [];
  let totalAmount = 0;
  let totalItems = 0;

  for (const item of cart.items) {
    if (!item.productId) continue;

    const prod = item.productId;
    const shop = prod.shopId;
    const shopIdStr = shop?._id ? shop._id.toString() : "unknown";
    const subtotal = (prod.price || 0) * item.quantity;
    const isAvailable =
      prod.productStatus === "AVAILABLE" &&
      shop?.approvalStatus === "APPROVED" &&
      shop?.operationStatus === "OPEN";
    const inStock = prod.stockQuantity >= item.quantity;

    const formattedItem = {
      productId: prod._id,
      productName: prod.productName,
      price: prod.price,
      images: prod.images || [],
      stockQuantity: prod.stockQuantity,
      quantity: item.quantity,
      subtotal,
      isAvailable,
      inStock,
      shopId: shop?._id || null,
      shopName: shop?.shopName || null,
    };

    formattedItems.push(formattedItem);
    totalAmount += subtotal;
    totalItems += item.quantity;

    if (!shopMap.has(shopIdStr)) {
      shopMap.set(shopIdStr, {
        shop: shop
          ? {
              _id: shop._id,
              shopName: shop.shopName,
              logoUrl: shop.logoUrl,
              address: shop.address,
              phone: shop.phone,
              approvalStatus: shop.approvalStatus,
              operationStatus: shop.operationStatus,
            }
          : null,
        items: [],
        subtotal: 0,
      });
    }

    const group = shopMap.get(shopIdStr);
    group.items.push(formattedItem);
    group.subtotal += subtotal;
  }

  return {
    _id: cart._id,
    customerId: cart.customerId,
    items: formattedItems,
    shops: Array.from(shopMap.values()),
    totalAmount,
    totalItems,
    updatedAt: cart.updatedAt,
  };
};

// UC32: Cập nhật số lượng
const updateItemQuantity = async (customerId, productId, quantity) => {
  assertObjectId(productId, "productId");

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại");
  }

  if (quantity > product.stockQuantity) {
    throw new AppError(
      400,
      `Số lượng cập nhật vượt quá tồn kho hiện có (tồn kho: ${product.stockQuantity})`,
    );
  }

  const cart = await Cart.findOne({ customerId });
  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại");
  }

  const item = cart.items.find((i) => i.productId.toString() === productId);
  if (!item) {
    throw new AppError(404, "Sản phẩm không có trong giỏ hàng");
  }

  item.quantity = quantity;
  await cart.save();
  return getCart(customerId);
};

// UC32: Xóa item khỏi giỏ
const removeItem = async (customerId, productId) => {
  assertObjectId(productId, "productId");

  const cart = await Cart.findOne({ customerId });
  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại");
  }

  const originalLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

  if (cart.items.length === originalLength) {
    throw new AppError(404, "Sản phẩm không có trong giỏ hàng");
  }

  await cart.save();
  return getCart(customerId);
};

// Clear toàn bộ giỏ
const clearCart = async (customerId) => {
  const cart = await Cart.findOne({ customerId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return getCart(customerId);
};

module.exports = {
  addToCart,
  getCart,
  updateItemQuantity,
  removeItem,
  clearCart,
};
