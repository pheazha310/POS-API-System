import app from "./app";
import { env } from "./config/env";

const startServer = (port: number): void => {
  const server = app.listen(port);

  server.on("listening", () => {
    const address = server.address();
    const boundPort = typeof address === "object" && address ? address.port : port;

    console.log(`Server running on http://localhost:${boundPort}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    throw error;
  });
};

startServer(env.port);
