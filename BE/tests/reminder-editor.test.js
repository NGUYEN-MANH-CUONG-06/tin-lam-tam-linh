const test = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/validators/content-editor.validator");
const { subscriptionSchema } = require("../src/validators/push.validator");
const {
  assertMemorialDates,
} = require("../src/utils/memorial-dates");
test("editor rejects impossible calendar days and forged approval fields", () => {
  const draft = { title: "Lễ hội", description: "", category: "", calendar: "LUNAR", day: 30, month: 1, source: "https://example.org/source", region: "NATIONWIDE", reviewNote: "Bổ sung từ nguồn tham khảo", editorialStatus: "DRAFT" };
  assert.equal(schemas.calendar.safeParse(draft).success, true);
  assert.equal(schemas.calendar.safeParse({ ...draft, day: 31 }).success, false);
  assert.equal(schemas.calendar.safeParse({ ...draft, calendar: "SOLAR", month: 2, day: 30 }).success, false);
  assert.equal(schemas.calendar.safeParse({ ...draft, verified: true }).success, false);
});
test("push endpoints reject internal addresses and suffix lookalikes", () => {
  const keys = { p256dh: "a".repeat(87), auth: "b".repeat(22) };
  for (const endpoint of ["http://127.0.0.1/admin", "https://fcm.googleapis.com.attacker.test/path", "https://localhost/path", "https://fcm.googleapis.com:444/path"]) assert.equal(subscriptionSchema.safeParse({ endpoint, keys }).success, false);
  assert.equal(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/example", keys }).success, true);
});

