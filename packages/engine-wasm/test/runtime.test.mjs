import assert from "node:assert/strict";
import test from "node:test";
import { createWasmGame } from "../dist/engine-wasm/src/index.js";

test("createWasmGame uses wasm runtime semantics from starting position", async () => {
  const game = await createWasmGame();
  const legalTargets = game
    .legalMoves("e2")
    .map((move) => move.to)
    .sort();

  assert.deepEqual(legalTargets, ["e3", "e4"]);

  const nextState = game.applyMove("e2", "e4");
  assert.equal(nextState.activeColor, "black");
  assert.equal(nextState.enPassantTarget, "e3");
});

test("createWasmGame supports promotion option flow", async () => {
  const game = await createWasmGame();

  const setupMoves = [
    ["a2", "a4"],
    ["b7", "b5"],
    ["a4", "b5"],
    ["b8", "c6"],
    ["b5", "b6"],
    ["h7", "h6"],
    ["b6", "b7"],
    ["h6", "h5"]
  ];

  for (const [from, to] of setupMoves) {
    game.applyMove(from, to);
  }

  const promotionMoves = game
    .legalMoves("b7")
    .filter((move) => move.to === "b8")
    .map((move) => move.promotion)
    .sort();

  assert.deepEqual(promotionMoves, ["bishop", "knight", "queen", "rook"]);

  const promotedState = game.applyMove("b7", "b8", "rook");
  assert.equal(promotedState.board.b8?.kind, "rook");
  assert.equal(promotedState.board.b8?.color, "white");
  assert.equal(promotedState.activeColor, "black");
});

test("createWasmGame applies king-side castling correctly", async () => {
  const game = await createWasmGame();

  const setupMoves = [
    ["g1", "f3"],
    ["g8", "f6"],
    ["e2", "e4"],
    ["e7", "e5"],
    ["f1", "e2"],
    ["f8", "e7"]
  ];

  for (const [from, to] of setupMoves) {
    game.applyMove(from, to);
  }

  const stateAfterCastle = game.applyMove("e1", "g1");

  assert.equal(stateAfterCastle.board.g1?.kind, "king");
  assert.equal(stateAfterCastle.board.g1?.color, "white");
  assert.equal(stateAfterCastle.board.f1?.kind, "rook");
  assert.equal(stateAfterCastle.board.f1?.color, "white");
  assert.equal(stateAfterCastle.castlingRights.whiteKingSide, false);
  assert.equal(stateAfterCastle.castlingRights.whiteQueenSide, false);
});

test("createWasmGame applies en passant correctly", async () => {
  const game = await createWasmGame();

  const setupMoves = [
    ["e2", "e4"],
    ["a7", "a6"],
    ["e4", "e5"],
    ["d7", "d5"]
  ];

  for (const [from, to] of setupMoves) {
    game.applyMove(from, to);
  }

  const legalTargets = game
    .legalMoves("e5")
    .map((move) => move.to)
    .sort();
  assert.ok(legalTargets.includes("d6"));

  const stateAfterEnPassant = game.applyMove("e5", "d6");
  assert.equal(stateAfterEnPassant.board.d6?.kind, "pawn");
  assert.equal(stateAfterEnPassant.board.d6?.color, "white");
  assert.equal(stateAfterEnPassant.board.d5, undefined);
  assert.equal(stateAfterEnPassant.activeColor, "black");
});
