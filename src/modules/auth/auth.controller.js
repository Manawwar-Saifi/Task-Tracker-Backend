import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  return successResponse(
    res,
    201,
    "User registered successfully",
    user
  );
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.loginUser(req.body);

  return successResponse(
    res,
    200,
    "Login successful",
    data
  );
});
