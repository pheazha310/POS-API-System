import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./core/middlewares/error-handler";
import { notFoundHandler } from "./core/middlewares/not-found";
import { registerModuleRoutes } from "./modules";

const app = express();
const cors = require("cors");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ status: "server is running" });
});

registerModuleRoutes(app, env.apiPrefix);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
