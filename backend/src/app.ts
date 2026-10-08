import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import medicineRoutes from "./routes/medicineRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import doseRoutes from "./routes/doseRoutes";

const app = express();

const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://medicine-reminder-stock-tracker-fro.vercel.app",
];

if (process.env.CLIENT_URL) {
  const envOrigins = process.env.CLIENT_URL.split(",").map((url) =>
    url.trim().replace(/\/$/, "")
  );
  for (const originUrl of envOrigins) {
    if (originUrl && !allowedOrigins.includes(originUrl)) {
      allowedOrigins.push(originUrl);
    }
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/$/, "");

      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin === "https://medicine-reminder-stock-tracker-fro.vercel.app" ||
        normalizedOrigin.endsWith(".vercel.app") ||
        normalizedOrigin.startsWith("http://localhost:") ||
        normalizedOrigin.startsWith("http://127.0.0.1:");

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Medicine Reminder API is running",
  });
});

// Routes
app.use("/api/medicines", medicineRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/doses", doseRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;