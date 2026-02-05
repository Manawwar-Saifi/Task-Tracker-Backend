import cloudinary from "../config/cloudinary.js";

/**
 * Upload file buffer to Cloudinary
 */
export const uploadToCloudinary = (
  buffer,
  folder,
  publicId
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};
