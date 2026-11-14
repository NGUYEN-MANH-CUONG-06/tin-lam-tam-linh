const path = require("node:path");
const { z } = require("zod");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const emptyToUndefined = (value) => value === "" ? undefined : value;
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_SSL_ROOT_CERT: optionalString,
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must contain at least 16 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    GOOGLE_CLIENT_ID: optionalString,
    GEMINI_API_KEY: optionalString,
    GEMINI_FALLBACK_MODEL: optionalString,
    XIN_XAM_CATALOG_TYPE: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
    TLTL_DEMO_AUTO_PUBLISH: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    PRIVATE_DATA_KEY: z.preprocess((value) => value === "" ? undefined : value, z.string().regex(/^[a-f0-9]{64}$/i, "PRIVATE_DATA_KEY must be 32 bytes encoded as 64 hexadecimal characters").optional()),
    SMTP_HOST: z.preprocess(emptyToUndefined, z.string().default("smtp.gmail.com")),
    SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(465)),
    SMTP_USER: z.preprocess(emptyToUndefined, z.string().email().optional()),
    SMTP_PASS: optionalString,
    SMTP_FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
    APP_BASE_URL: z.string().url().default("http://localhost:3000"),
    GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
    MEMBERSHIP_SALES_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DIGITAL_SALES_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SEPAY_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
    SEPAY_MERCHANT_ID: optionalString,
    SEPAY_SECRET_KEY: optionalString,
    SEPAY_IPN_SECRET: optionalString,
    VNPAY_TMN_CODE: optionalString,
    VNPAY_HASH_SECRET: optionalString,
    VNPAY_PAYMENT_URL: z.preprocess(emptyToUndefined, z.string().url().default("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")),
    VNPAY_RETURN_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    VAPID_SUBJECT: optionalString,
    VAPID_PUBLIC_KEY: optionalString,
    VAPID_PRIVATE_KEY: optionalString,
    SCHOOL_SUPPORT_NAME: optionalString,
    SCHOOL_SUPPORT_PHONE: optionalString,
    SCHOOL_SUPPORT_SOURCE: optionalString,
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
    CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production" && !value.PRIVATE_DATA_KEY) {
      context.addIssue({ code: "custom", path: ["PRIVATE_DATA_KEY"], message: "PRIVATE_DATA_KEY is required in production" });
    }
    if (value.NODE_ENV === "production" && value.TLTL_DEMO_AUTO_PUBLISH) {
      context.addIssue({ code: "custom", path: ["TLTL_DEMO_AUTO_PUBLISH"], message: "TLTL_DEMO_AUTO_PUBLISH must be false in production" });
    }
    if (value.NODE_ENV === "production" && value.JWT_ACCESS_SECRET.length < 32) {
      context.addIssue({
        code: "custom",
        path: ["JWT_ACCESS_SECRET"],
        message: "JWT_ACCESS_SECRET must contain at least 32 characters in production",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

module.exports = Object.freeze(result.data);
