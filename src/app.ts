import express from "express";
import authRoutes from "./modules/auth/routes/auth.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "server is running" });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;