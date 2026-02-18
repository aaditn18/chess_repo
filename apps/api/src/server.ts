import { createApiServer } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = createApiServer();

server.listen(PORT, () => {
  console.log(`@chess/api listening on http://localhost:${PORT}`);
});
