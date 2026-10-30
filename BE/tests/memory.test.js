const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

test("calendar notes are private and account-scoped; memorial routes are removed", { timeout: 30_000 }, async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const suffix = Date.now();
  async function request(path, { method = "GET", body, token } = {}) {
    const headers = {};
    if (body) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { response, payload: await response.json() };
  }
  async function register(email) {
    const result = await request("/api/auth/register", { method: "POST", body: { fullName: "Memory Test", email, password: "StrongPassword123" } });
    assert.equal(result.response.status, 201);
    return result.payload.data.accessToken;
  }
  try {
    const token = await register(`memory-${suffix}@example.com`);
    const other = await register(`memory-other-${suffix}@example.com`);
    assert.equal((await request("/api/memory/memorial", { token })).response.status, 404);
    assert.equal((await request("/api/memorials", { token })).response.status, 404);
    const note = await request("/api/memory/calendar/notes", { method: "POST", token, body: { title: "Ngày thiện lành", day: 17, month: 10, year: 2024 } });
    assert.equal(note.response.status, 201);
    const otherNotes = await request("/api/memory/calendar/notes", { token: other });
    assert.equal(otherNotes.payload.data.items.length, 0);
    const deleted = await request(`/api/memory/calendar/notes/${note.payload.data.id}`, { method: "DELETE", token });
    assert.equal(deleted.response.status, 200);

  } finally {
    server.close();
    await prisma.$disconnect();
  }
});
