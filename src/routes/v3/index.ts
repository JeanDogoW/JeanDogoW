// ./routes/index.js
const Router = require("express-promise-router");
const dataRouter = require("./data");

var router = new Router();

router.use("/data", dataRouter);

export = router;