import type { ServerResponse } from "node:http";

export function health(response: ServerResponse): void {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ status: "ok", service: "@chess/api" }));
}
