import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import masteryRoutes from "./routes/mastery";
import interventionRoutes from "./routes/interventions";
import reviewRoutes from "./routes/review";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/mastery", masteryRoutes);
app.use("/api/mentor/interventions", interventionRoutes);
app.use("/api/mentor/review", reviewRoutes);
app.use(errorHandler);

const PORT = process.env.MASTERY_PORT ?? 4006;
app.listen(PORT, () => console.log(`mastery-service running on :${PORT}`));
