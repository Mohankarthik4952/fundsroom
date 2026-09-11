import dotenv from "dotenv";

dotenv.config();

const defaultClientUrls = ["http://localhost:5173", "http://localhost:5174"];

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-this-before-production",
  clientUrl: (process.env.CLIENT_URL || defaultClientUrls.join(","))
    .split(",")
    .map((value) => value.trim()),
};
