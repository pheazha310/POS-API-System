import express from "express";

import { errorHandler } from "./core/middlewares/error-handler";
import { notFoundHandler } from "./core/middlewares/not-found";
import { productRouter } from "./modules/products/routes/product.routes";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "POS API is running",
    data: null,
  });
});

app.use("/api/v1/products", productRouter);

app.use(notFoundHandler);
app.use(errorHandler);
