import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import scriptRoutes from "./routes/scripts";
import sessionRoutes from "./routes/sessions";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/admin/scripts", scriptRoutes);
app.use("/api/interviews", sessionRoutes);
app.use(errorHandler);

const PORT = process.env.INTERVIEW_PORT ?? 4005;
app.listen(PORT, () => console.log(`interview-service running on :${PORT}`));
