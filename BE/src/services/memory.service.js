const repository = require("../repositories/memory.repository");
const ApiError = require("../utils/api-error");

function toNote(record) {
  return { id: record.id, title: record.title, day: record.event_date.getUTCDate(), month: record.event_date.getUTCMonth() + 1, year: record.event_date.getUTCFullYear(), type: "personal", typeLabel: "Ghi chú cá nhân", region: "Cá nhân", shortDesc: record.note || "Ngày dự định do bạn chọn.", lunarDate: "", note: record.note || undefined };
}

async function listNotes(userId) { return (await repository.listNotes(userId)).map(toNote); }
async function createNote(userId, input) {
  const eventDate = new Date(Date.UTC(input.year, input.month - 1, input.day));
  const existing = await repository.findNoteByDateAndTitle(userId, input.title, eventDate);
  if (existing) return toNote(existing);
  return toNote(await repository.createNote({ user_id: userId, title: input.title, note: input.note || null, event_date: eventDate }));
}
async function deleteNote(userId, id) { const removed = await repository.removeNote(id, userId); if (removed.count !== 1) throw new ApiError(404, "Calendar note not found"); }

module.exports = { listNotes, createNote, deleteNote };
