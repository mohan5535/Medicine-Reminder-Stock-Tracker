import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app";
import connectDatabase from "./config/database";

const startServer = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT || 5000);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new Error("PORT must be an integer between 0 and 65535");
    }

    await connectDatabase();

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on port ${port} (0.0.0.0)`);
        resolve();
      });
      server.once("error", reject);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

startServer();