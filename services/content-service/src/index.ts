import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import competencyRoutes from "./routes/competencies";
import questionRoutes from "./routes/questions";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/admin/competencies", competencyRoutes);
app.use("/api/admin/questions", questionRoutes);
app.use(errorHandler);

const PORT = process.env.CONTENT_PORT ?? 4003;
app.listen(PORT, () => console.log(`content-service running on :${PORT}`));
