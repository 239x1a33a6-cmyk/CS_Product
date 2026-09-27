import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "@cs-platform/shared";
import userRoutes from "./routes/users";
import cohortRoutes from "./routes/cohorts";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/admin/cohorts", cohortRoutes);
app.use(errorHandler);

const PORT = process.env.USER_PORT ?? 4002;
app.listen(PORT, () => console.log(`user-service running on :${PORT}`));
