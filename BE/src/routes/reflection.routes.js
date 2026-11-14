const express = require("express");
const { z } = require("zod");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const controller = require("../controllers/reflection.controller");
const { xinXamDrawSchema, xinXamRequestSchema, savedItemUpdateSchema, wishSchema, xinKeoSessionSchema, xinKeoThrowSchema, xinKeoInterpretationSchema, xinXamInterpretationSchema } = require("../validators/reflection.validator");

const router = express.Router();
router.use(authenticate);
router.get("/xin-xam", controller.listXam);
router.post("/xin-xam/draw", validate(xinXamRequestSchema), controller.drawXam);
router.post("/xin-xam/:id/interpretation", validate(z.object({ id: z.string().uuid() }), "params"), validate(xinXamInterpretationSchema), controller.interpretXam);
router.post("/xin-xam", validate(xinXamDrawSchema), controller.saveXam);
router.patch("/xin-xam/:id", validate(savedItemUpdateSchema), controller.updateXam);
router.delete("/xin-xam/:id", controller.deleteXam);
router.get("/wishes", controller.listWishes);
router.post("/wishes", validate(wishSchema), controller.createWish);
router.patch("/wishes/:id", validate(savedItemUpdateSchema), controller.updateWish);
router.delete("/wishes/:id", controller.deleteWish);
router.get("/xin-keo/sessions", controller.listKeoSessions);
router.get(
  "/xin-keo/sessions/:id",
  validate(
    z.object({
      id: z.string().uuid(),
    }),
    "params",
  ),
  controller.getKeoSession,
);
router.post("/xin-keo/sessions", validate(xinKeoSessionSchema), controller.createKeoSession);
router.post("/xin-keo/sessions/:id/throws", validate(xinKeoThrowSchema), controller.throwKeo);
router.post("/xin-keo/sessions/:id/throws/:throwId/interpretation", validate(z.object({ id: z.string().uuid(), throwId: z.string().uuid() }), "params"), validate(xinKeoInterpretationSchema), controller.interpretKeo);
module.exports = router;
