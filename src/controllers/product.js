const Product = require("../models/product.js");
require("../models/shop.js");
require("../models/category.js");

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("shopId")
      .populate("categoryId");

    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productName: product.productName,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      images: product.images,
      expiryDate: product.expiryDate,
      productStatus: product.productStatus,
      shopId: product.shopId?._id || null,
      shopName: product.shopId?.shopName || "No Shop",
      categoryId: product.categoryId?._id || null,
      categoryName: product.categoryId?.categoryName || "No Category",
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    res.status(500).json({
      message: error.toString(),
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("shopId")
      .populate("categoryId");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.toString(),
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
