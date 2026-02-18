import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { health } from "./routes/health.js";
import { botsModule } from "./modules/bots/placeholder.js";
import { matchmakingModule } from "./modules/matchmaking/placeholder.js";
import { realtimeModule } from "./modules/realtime/placeholder.js";

export function handleApiRequest(request: IncomingMessage, response: ServerResponse): void {
  const url = request.url ?? "/";

  if (url === "/health") {
    health(response);
    return;
  }

  if (url === "/boundaries") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        realtime: realtimeModule,
        matchmaking: matchmakingModule,
        bots: botsModule
      })
    );
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
}

export function createApiServer(): http.Server {
  return http.createServer(handleApiRequest);
}
