const env = require("../config/env");

function configured() {
  return Boolean(
    env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT,
  );
}

module.exports = { configured };
