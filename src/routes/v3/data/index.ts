// ./routes/index.js
const Router = require("express-promise-router");
const pointRouter = require("./point");
const pointInfoRouter = require("./pointInfo");
const polygonRouter = require("./polygon")
const polygonInfoRouter = require("./polygonInfo")
const lineRouter = require("./line")
const lineInfoRouter = require("./lineInfo")

var router = new Router();

router.use("/point", pointRouter);
router.use("/point-info", pointInfoRouter);
router.use("/polygon", polygonRouter)
router.use("/polygon-info", polygonInfoRouter)
router.use("/line", lineRouter)
router.use("/line-info", lineInfoRouter)

export = router;