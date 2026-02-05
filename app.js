import express from "express";
import cors from "cors";

import routes from "./src/routes.js";
import AppError from "./src/utils/AppError.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import rateLimitMiddleware from "./src/middlewares/rateLimit.middleware.js";

const app = express();

/* -------------------- GLOBAL MIDDLEWARES -------------------- */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimitMiddleware);

/* -------------------- ROUTES -------------------- */

app.use("/api/v1", routes);

/* -------------------- 404 HANDLER -------------------- */

// app.all("*", (req, res, next) => {
//   next(
//     new AppError(
//       `Route ${req.originalUrl} not found`,
//       404
//     )
//   );
// });

/* -------------------- GLOBAL ERROR HANDLER -------------------- */

app.use(errorMiddleware);

export default app;
