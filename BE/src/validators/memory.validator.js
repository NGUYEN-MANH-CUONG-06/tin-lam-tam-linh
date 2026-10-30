const { z } = require("zod");

const calendarNoteSchema = z.object({
  title: z.string().trim().min(1).max(255),
  day: z.coerce.number().int().min(1).max(31),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1).max(9999),
  note: z.string().trim().max(2000).optional(),
});

module.exports = { calendarNoteSchema };
