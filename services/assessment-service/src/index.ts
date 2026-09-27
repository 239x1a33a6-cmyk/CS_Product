import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import assessmentRoutes from "./routes/assessments";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/assessments", assessmentRoutes);
app.use(errorHandler);

const PORT = process.env.ASSESSMENT_PORT ?? 4004;
app.listen(PORT, () => console.log(`assessment-service running on :${PORT}`));
