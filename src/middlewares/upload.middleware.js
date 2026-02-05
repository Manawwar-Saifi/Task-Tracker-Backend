import multer from "multer";
import AppError from "../utils/AppError.js";

/**
 * Multer config (memory storage)
 */
const storage = multer.memoryStorage();

/**
 * File filter
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(
      new AppError(
        "Only JPG, PNG, and WEBP images are allowed",
        400
      ),
      false
    );
  } else {
    cb(null, true);
  }
};

/**
 * Upload middleware
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
