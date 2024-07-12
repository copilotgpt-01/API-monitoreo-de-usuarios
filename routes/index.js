const express = require("express");

const userRouter = require("./user.router");
const eventRouter = require("./event.router");

function routerApi(app) {
  const router = express.Router();
  app.use("/api/v1", router);
  router.use("/user", userRouter);
  router.use("/event", eventRouter);
}

module.exports = routerApi;
