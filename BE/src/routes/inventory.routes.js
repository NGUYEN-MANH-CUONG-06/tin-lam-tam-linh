const router = require("express").Router();
const { z } = require("zod");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const {
  listInventory,
  useRoyalLantern,
  setDecoration,
} = require("../services/digital-inventory.service");
const { sendSuccess } = require("../utils/response");

router.use(authenticate);

router.get("/", async (req, res) => {
  return sendSuccess(res, {
    data: {
      items: await listInventory(req.user.id),
    },
  });
});

router.post(
  "/royal-lantern/use",
  validate(
    z.object({
      requestId: z.string().uuid(),
    }).strict()
  ),
  async (req, res) => {
    return sendSuccess(res, {
      data: await useRoyalLantern(
        req.user.id,
        req.body.requestId
      ),
    });
  }
);

router.post(
  "/decoration",
  validate(
    z.object({
      itemCode: z.enum([
        "JADE_LOTUS",
        "GOLDEN_LOTUS",
        "INCENSE_BURNER",
        "BOILED_CHICKEN",
      ]).nullable(),
    }).strict()
  ),
  async (req, res) => {
    return sendSuccess(res, {
      data: await setDecoration(
        req.user.id,
        req.body.itemCode
      ),
    });
  }
);

module.exports = router;
