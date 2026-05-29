import express from "express";
import { env } from "./config/env";

import authRoutes from "./modules/auth/routes/auth.routes";

const app = express();

app.use(express.json());

app.use(`${env.apiPrefix}/auth`, authRoutes);

export default app;
