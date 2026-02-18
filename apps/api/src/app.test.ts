import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "./app.js";

type JsonRecord = Record<string, unknown>;

function requestJson(url: string): { status: number; data: JsonRecord; contentType: string } {
  const request = { url } as IncomingMessage;
  let status = 0;
  let contentType = "";
  let body = "";

  const response = {
    writeHead(code: number, headers?: Record<string, string>): ServerResponse {
      status = code;
      contentType = headers?.["content-type"] ?? "";
      return this as unknown as ServerResponse;
    },
    end(chunk?: string | Buffer): ServerResponse {
      body = chunk ? chunk.toString() : "";
      return this as unknown as ServerResponse;
    }
  } as unknown as ServerResponse;

  handleApiRequest(request, response);

  return {
    status,
    data: JSON.parse(body) as JsonRecord,
    contentType
  };
}

describe("api routes", () => {
  it("returns healthy status on /health", () => {
    const response = requestJson("/health");
    assert.equal(response.status, 200);
    assert.match(response.contentType, /application\/json/);
    assert.deepEqual(response.data, { status: "ok", service: "@chess/api" });
  });

  it("returns reserved module boundaries on /boundaries", () => {
    const response = requestJson("/boundaries");
    assert.equal(response.status, 200);
    assert.match(response.contentType, /application\/json/);
    assert.deepEqual(response.data, {
      realtime: { boundary: "/ws", status: "reserved" },
      matchmaking: { boundary: "/matchmaking", status: "reserved" },
      bots: { boundary: "/bots", status: "reserved" }
    });
  });

  it("returns not_found for unknown routes", () => {
    const response = requestJson("/unknown");
    assert.equal(response.status, 404);
    assert.match(response.contentType, /application\/json/);
    assert.deepEqual(response.data, { error: "not_found" });
  });
});
