// ./routes/index.js
const Router = require("express-promise-router");
const user = require("./user");
const data = require("./data");
const func = require("./func");
const v2 = require("./v2");
const v3 = require("./v3")
// const photos = require("./photos");

var express = require("express");
var router = new Router();

router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router.use("/data", data);
router.use("/user", user);
router.use("/func", func);
router.use("/v2", v2);
router.use("/v3", v3);


module.exports = router;

// module.exports = app => {
//   app.use("/user", user);
//   app.use("/data", data);
//   // app.use("/photos", photos);
//   // etc..
// };
