import AppError from "../utils/AppError.js";

const permissionMiddleware = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permission)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }
    next();
  };
};

export default permissionMiddleware;
