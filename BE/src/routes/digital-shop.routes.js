const router = require("express").Router();
const { z } = require("zod");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const service = require("../services/digital-shop.service");
const { sendSuccess } = require("../utils/response");

router.get("/", (_req, res) => {
  return sendSuccess(res, {
    data: service.catalog(),
  });
});

router.post(
  "/checkout",
  authenticate,
  validate(z.object({
    requestId: z.string().uuid(),
    itemCode: z.enum([
      "ROYAL_LANTERN",
      "GOLDEN_LOTUS",
      "INCENSE_BURNER",
      "BOILED_CHICKEN",
    ]),
  }).strict()),
  async (req, res) => {
    return sendSuccess(res, {
      data: await service.checkout(
        req.user.id,
        req.body.requestId,
        req.ip,
        req.body.itemCode
      ),
    });
  }
);

router.get(
  "/orders/:id",
  authenticate,
  validate(z.object({
    id: z.string().regex(/^DI[a-f0-9]{30}$/i),
  }), "params"),
  async (req, res) => {
    return sendSuccess(res, {
      data: await service.getOrder(
        req.user.id,
        req.params.id
      ),
    });
  }
);

router.post(
  "/attempts/abandon",
  authenticate,
  validate(
    z.object({
      requestId: z.string().uuid(),
      itemCode: z.enum([
        "ROYAL_LANTERN",
        "GOLDEN_LOTUS",
        "INCENSE_BURNER",
        "BOILED_CHICKEN",
      ]),
    }).strict()
  ),
  async (req, res) => {
    return sendSuccess(res, {
      data: await service.abandonAttempt(
        req.user.id,
        req.body.requestId,
        req.body.itemCode
      ),
    });
  }
);

router.post(
  "/orders/:id/close-window",
  authenticate,
  validate(
    z.object({
      id: z.string().regex(/^DI[a-f0-9]{30}$/i),
    }),
    "params"
  ),
  validate(
    z.object({
      acceptLatePayment: z.literal(true),
    }).strict()
  ),
  async (req, res) => {
    return sendSuccess(res, {
      data: await service.closeExpiredWindow(
        req.user.id,
        req.params.id
      ),
    });
  }
);

module.exports = router;
