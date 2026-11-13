const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

require("./test-env");

const app = require("../src/app");
const prisma = require("../src/config/prisma");
const { castPieces } = require("../src/services/xin-keo-algorithm");

test("xin keo maps physical sides to three outcomes", () => {
  const cast = (values) => castPieces(() => values.shift());

  assert.equal(cast([0.1, 0.9]).result, "YES");
  assert.equal(cast([0.9, 0.1]).result, "YES");
  assert.equal(cast([0.1, 0.2]).result, "NO");
  assert.equal(cast([0.8, 0.9]).result, "UNCLEAR");
});

test("xin keo samples each side independently and never retries a result", () => {
  const values = [0.1, 0.1, 0.1, 0.9];
  const calls = [];
  const outcomes = [
    castPieces(() => { calls.push(values.shift()); return calls.at(-1); }),
    castPieces(() => { calls.push(values.shift()); return calls.at(-1); }),
  ];

  assert.equal(calls.length, 4);
  assert.deepEqual(outcomes.map(({ result }) => result), ["NO", "YES"]);
});

test(
  "saved reflections enforce ownership and request idempotency",
  { timeout: 60_000 },
  async () => {
    const server = app.listen(0);

    await new Promise((resolve) =>
      server.once("listening", resolve)
    );

    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const createdUserIds = [];

    async function request(
      path,
      { method = "GET", body, token } = {}
    ) {
      const headers = {};

      if (body !== undefined) {
        headers["content-type"] = "application/json";
      }

      if (token) {
        headers.authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      return {
        status: response.status,
        ok: response.ok,
        payload: await response.json(),
      };
    }

    async function register() {
      const result = await request("/auth/register", {
        method: "POST",
        body: {
          fullName: "Reflection Integration Test",
          email: `reflection-${randomUUID()}@example.com`,
          password: "StrongPassword123",
        },
      });

      assert.equal(result.status, 201);

      const { user, accessToken } = result.payload.data;
      createdUserIds.push(user.id);

      return accessToken;
    }

    try {
      const tokenA = await register();
      const tokenB = await register();

      assert.equal(
        (await request("/wishes")).status,
        401
      );

      // Lưu cùng request hai lần đồng thời.
      const wishInput = {
        requestId: randomUUID(),
        category: "Bình an",
        content: "Mong có thời gian nghỉ ngơi phù hợp.",
      };

      const [first, replay] = await Promise.all([
        request("/wishes", {
          method: "POST",
          token: tokenA,
          body: wishInput,
        }),
        request("/wishes", {
          method: "POST",
          token: tokenA,
          body: wishInput,
        }),
      ]);

      assert.equal(first.ok, true);
      assert.equal(replay.ok, true);
      assert.equal(
        first.payload.data.id,
        replay.payload.data.id
      );

      const wishId = first.payload.data.id;

      const ownList = await request("/wishes", {
        token: tokenA,
      });

      assert.equal(
        ownList.payload.data.items.filter(
          (item) => item.id === wishId
        ).length,
        1
      );

      const otherList = await request("/wishes", {
        token: tokenB,
      });

      assert.equal(
        otherList.payload.data.items.some(
          (item) => item.id === wishId
        ),
        false
      );

      // Không dùng lại mã lưu cho nội dung khác.
      const conflict = await request("/wishes", {
        method: "POST",
        token: tokenA,
        body: {
          ...wishInput,
          content: "Nội dung khác.",
        },
      });

      assert.equal(conflict.status, 409);

      // Tài khoản B không sửa/xóa được lời của A.
      assert.equal(
        (
          await request(`/wishes/${wishId}`, {
            method: "PATCH",
            token: tokenB,
            body: { starred: true },
          })
        ).status,
        404
      );

      assert.equal(
        (
          await request(`/wishes/${wishId}`, {
            method: "DELETE",
            token: tokenB,
          })
        ).status,
        404
      );

      // Không cho lưu xăm chỉ bằng dữ liệu client.
      const forgedXam = await request(
        "/reflections/xin-xam",
        {
          method: "POST",
          token: tokenA,
          body: {
            stickNumber: 7,
            xamType: "Bình an",
            region: "Bắc Bộ",
          },
        }
      );

      assert.equal(forgedXam.status, 422);

      const sessionResult = await request(
        "/reflections/xin-keo/sessions",
        {
          method: "POST",
          token: tokenA,
          body: { question: "Chủ đề: Bình an" },
        }
      );

      assert.equal(sessionResult.ok, true);

      const sessionId = sessionResult.payload.data.id;
      const sessionPath =
        `/reflections/xin-keo/sessions/${sessionId}`;

      assert.equal(
        (
          await request(sessionPath, {
            token: tokenB,
          })
        ).status,
        404
      );

      const castInput = { requestId: randomUUID() };

      const casts = await Promise.all([
        request(`${sessionPath}/throws`, {
          method: "POST",
          token: tokenA,
          body: castInput,
        }),
        request(`${sessionPath}/throws`, {
          method: "POST",
          token: tokenA,
          body: castInput,
        }),
      ]);

      assert.equal(casts[0].ok, true);
      assert.equal(casts[1].ok, true);
      assert.equal(
        casts[0].payload.data.id,
        casts[1].payload.data.id
      );

      const restored = await request(sessionPath, {
        token: tokenA,
      });

      assert.equal(
        restored.payload.data.throws.length,
        1
      );

      // Gieo thêm hai lượt khác.
      for (let index = 0; index < 2; index += 1) {
        const result = await request(
          `${sessionPath}/throws`,
          {
            method: "POST",
            token: tokenA,
            body: { requestId: randomUUID() },
          }
        );

        assert.equal(result.ok, true);
        assert.equal(
          result.payload.data.throwNumber,
          index + 2
        );
      }

      // Đủ ba lượt vẫn được đọc lại request cũ.
      const oldReplay = await request(
        `${sessionPath}/throws`,
        {
          method: "POST",
          token: tokenA,
          body: castInput,
        }
      );

      assert.equal(oldReplay.ok, true);
      assert.equal(
        oldReplay.payload.data.id,
        casts[0].payload.data.id
      );

      const fourth = await request(
        `${sessionPath}/throws`,
        {
          method: "POST",
          token: tokenA,
          body: { requestId: randomUUID() },
        }
      );

      assert.equal(fourth.status, 409);

      const deleted = await request(`/wishes/${wishId}`, {
        method: "DELETE",
        token: tokenA,
      });

      assert.equal(deleted.ok, true);

      const afterDelete = await request("/wishes", {
        token: tokenA,
      });

      assert.equal(
        afterDelete.payload.data.items.some(
          (item) => item.id === wishId
        ),
        false
      );
    } finally {
      try {
        if (createdUserIds.length) {
          await prisma.users.deleteMany({
            where: {
              id: { in: createdUserIds },
            },
          });
        }
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) =>
            error ? reject(error) : resolve()
          );
        });

        await prisma.$disconnect();
      }
    }
  }
);
