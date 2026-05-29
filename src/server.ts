import { app } from "./app";
import { env } from "./config/env";
const port = env.PORT || 3000;

app.listen(port, () => {
  console.log(`POS API server running on port http://localhost:${port}`);
});
