// ./routes/index.js
const Router = require("express-promise-router");
const user = require("./user");
const data = require("./data");
const func = require("./func");

var express = require("express");
var router = new Router();

router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router.use("/data", data);
router.use("/user", user);
router.use("/func", func);


module.exports = router;