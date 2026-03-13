import dotenv from "dotenv";
dotenv.config();

import app from "../app.js";
import connectDB from "./config/db.js";

let isConnected = false;

async function init() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

export default async function handler(req, res) {
  await init();
  return app(req, res);
}
