import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import aiRoutes from "./routes/ai";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRoutes);
app.use(errorHandler);

const PORT = process.env.AI_PORT ?? 4007;
app.listen(PORT, () => console.log(`ai-service running on :${PORT}`));
