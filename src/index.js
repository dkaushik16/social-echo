import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load env variables
dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8000;

// Database connection
connectDB()
  .then(() => {
    // Start server after DB is connected
    const server = app.listen(PORT, () => {
      console.log(`APP IS RUNNING ON PORT : ${PORT}`);
    });

    // Listen for server errors
    server.on("error", (error) => {
      console.error("SERVER ERROR:", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("MONGODB CONNECTION FAILED:", error);
    process.exit(1);
  });
