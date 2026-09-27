import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import authRoutes from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

const PORT = process.env.AUTH_PORT ?? 4001;
app.listen(PORT, () => console.log(`auth-service running on :${PORT}`));
