const { z } = require("zod");

const xinXamDrawSchema = z.object({
  drawId: z.string().uuid().optional(),
  resultToken: z.string().min(1).max(10000).optional(),
  stickNumber: z.coerce.number().int().min(1).max(999),
  xamType: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  fortuneType: z.string().trim().max(80).optional(),
  quote: z.string().trim().max(2000).optional(),
  question: z.string().trim().max(2000).optional(),
}).refine(
  (value) => Boolean(value.drawId || value.resultToken),
  {
    path: ["resultToken"],
    message: "Cần mã lượt rút hợp lệ để lưu kết quả.",
  },
);

const xinXamRequestSchema = z.object({
  region: z.enum(["Bắc Bộ", "Trung Bộ", "Nam Bộ", "Toàn quốc"]),
  topic: z.enum(["Bình an", "Gia đình", "Học tập", "Công việc"]),
  question: z.string().trim().max(2000).optional(),
});

const savedItemUpdateSchema = z.object({ starred: z.boolean() });

const wishSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  category: z.string().trim().max(100).optional(),
  requestId: z.string().uuid().optional(),
});

const xinKeoSessionSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  drawId: z.string().uuid().optional(),
});

const xinKeoThrowSchema = z.object({
  requestId: z.string().uuid().optional(),
}).strict();
const xinKeoTossSchema = z.object({
  sessionId: z.string().uuid().optional(),
  question: z.string().trim().min(1).max(2000).optional(),
  drawId: z.string().uuid().optional(),
}).refine((value) => value.sessionId || value.question, { path: ["question"], message: "Question is required for a new session" });

module.exports = { xinXamDrawSchema, xinXamRequestSchema, savedItemUpdateSchema, wishSchema, xinKeoSessionSchema, xinKeoThrowSchema, xinKeoTossSchema };
