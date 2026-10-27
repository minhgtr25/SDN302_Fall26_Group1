const express = require("express");
const authController = require("./auth.controller.js");
const { auth } = require("../../common/middlewares/auth.js");

const authRouter = express.Router();

// Public - UC02
authRouter.post("/auth/login", authController.login);
authRouter.post("/auth/register", authController.register);
authRouter.get("/auth/me", auth, authController.me);

module.exports = authRouter;
