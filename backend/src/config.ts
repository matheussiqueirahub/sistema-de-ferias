export const config = {
  jwtSecret: process.env.JWT_SECRET || "change_me_super_secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
