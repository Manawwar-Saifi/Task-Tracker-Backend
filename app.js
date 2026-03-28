import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import routes from "./src/routes.js";
import AppError from "./src/utils/AppError.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import rateLimitMiddleware from "./src/middlewares/rateLimit.middleware.js";
import logger from "./src/utils/logger.js";

const app = express();

/* -------------------- PROXY TRUST (for Vercel/serverless) -------------------- */

// Trust first proxy (Vercel, AWS, etc.) for correct IP detection
app.set("trust proxy", 1);

/* -------------------- SECURITY MIDDLEWARES -------------------- */

// Set security HTTP headers
app.use(helmet());

// Enable CORS — use CORS_ORIGINS array in production, allow all in dev
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((u) => u.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" && allowedOrigins.length > 0
      ? allowedOrigins
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(rateLimitMiddleware);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

/* -------------------- BODY PARSERS -------------------- */

// Body parser - JSON
app.use(express.json({ limit: "10mb" }));

// Body parser - URL encoded
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

/* -------------------- LOGGING -------------------- */

// HTTP request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // Production logging
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

/* -------------------- HEALTH CHECK -------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* -------------------- API ROUTES -------------------- */

app.get("/", (req, res) => {
  res.json({ success: true, message: "WorkTrack API", version: "1.0", docs: "/api/v1/health" });
});

app.use("/api/v1", routes);

/* -------------------- 404 HANDLER -------------------- */

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

/* -------------------- GLOBAL ERROR HANDLER -------------------- */

app.use(errorMiddleware);

export default app;
