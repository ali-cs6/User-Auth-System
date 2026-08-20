import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Please fill input Fields");
  }

  const { fullname, email, username, password } = req.body;

  //validation

  // checking for empty fields
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }

  // if user already exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // DB work
  try {
    // create new user in DB according to taken data
    const user = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: "dummy",
    });

    // checking if registered correctly
    // retrieving from db, except password & token
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User Creation Failed", error);
    throw new ApiError(500, "Something went Wrong while registering the user");
  }
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // checking if user exist
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(500, "Error while generating access and refresh token");
  }
};

loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // validation
  if (!email && !password) {
    throw new ApiError(400, "Please provide email and password");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  //onboarding the user
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  // preparing for response and extra check
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in the user");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged in successfully",
      ),
    );
});
