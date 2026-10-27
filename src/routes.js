const express = require("express");
const authRouter = require("./modules/auth/auth.routes.js");
const categoryRouter = require("./modules/categories/category.routes.js");
const productRouter = require("./modules/products/product.routes.js");
const myshopProductRouter = require("./modules/products/myshop-product.routes.js");
const shopRouter = require("./modules/shops/shop.routes.js");
const shopStatsRouter = require("./modules/statistics/shop-stats.routes.js");
const cartRouter = require("./modules/carts/cart.routes.js");
const orderRouter = require("./modules/orders/order.routes.js");

const router = express.Router();

// mỗi module tự khai báo đường dẫn đầy đủ, ở đây chỉ gom lại
// Luồng 1 (bản tạm, chỉ có đăng nhập để test)
router.use(authRouter);

// Luồng 3
router.use(categoryRouter);
router.use(productRouter);
router.use(myshopProductRouter);
router.use(shopRouter);
router.use(shopStatsRouter);

// Luồng 4: Mua hàng & Đặt hàng (phía khách) - UC30 đến UC37
router.use(cartRouter);
router.use(orderRouter);

module.exports = router;
