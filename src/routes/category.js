const express = require("express");
const {
  getCategories,
  getCategoriesByShop,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.js");

const categoryRouter = express.Router();

categoryRouter.get("/categories", getCategories);
categoryRouter.get("/categories/shop/:shopId", getCategoriesByShop);
categoryRouter.get("/categories/:id", getCategoryById);
categoryRouter.post("/categories", createCategory);
categoryRouter.put("/categories/:id", updateCategory);
categoryRouter.patch("/categories/:id", updateCategory);
categoryRouter.delete("/categories/:id", deleteCategory);

module.exports = categoryRouter;
