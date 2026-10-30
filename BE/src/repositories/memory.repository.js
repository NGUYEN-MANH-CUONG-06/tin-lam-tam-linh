const prisma = require("../config/prisma");

function listNotes(userId, client = prisma) { return client.calendar_notes.findMany({ where: { user_id: userId }, orderBy: { event_date: "desc" } }); }
function findNote(id, userId, client = prisma) { return client.calendar_notes.findFirst({ where: { id, user_id: userId } }); }
function createNote(data, client = prisma) { return client.calendar_notes.create({ data }); }
function findNoteByDateAndTitle(userId, title, eventDate, client = prisma) {
  return client.calendar_notes.findFirst({ where: { user_id: userId, title, event_date: eventDate } });
}
function removeNote(id, userId, client = prisma) { return client.calendar_notes.deleteMany({ where: { id, user_id: userId } }); }

module.exports = { listNotes, findNote, findNoteByDateAndTitle, createNote, removeNote };
