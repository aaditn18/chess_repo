pub mod board;
pub mod fen;
pub mod game;
pub mod move_gen;
pub mod rules;

pub use board::{Piece, PieceColor, PieceKind, Square};
pub use game::{CastlingRights, EngineError, GameState, GameStatus, Move, MoveInput, MoveResult};

#[derive(Debug, Clone)]
pub struct ChessEngine {
    state: GameState,
}

impl ChessEngine {
    pub fn new_game() -> Self {
        Self { state: new_game() }
    }

    pub fn from_fen(fen: &str) -> Result<Self, EngineError> {
        let state = from_fen(fen)?;
        Ok(Self { state })
    }

    pub fn legal_moves(&self, square: Square) -> Vec<Move> {
        legal_moves(&self.state, square)
    }

    pub fn apply_move(&mut self, input: MoveInput) -> Result<MoveResult, EngineError> {
        let result = apply_move(&self.state, input)?;
        self.state = result.state.clone();
        Ok(result)
    }

    pub fn status(&self) -> GameStatus {
        status(&self.state)
    }

    pub fn to_fen(&self) -> String {
        to_fen(&self.state)
    }

    pub fn state(&self) -> &GameState {
        &self.state
    }
}

pub fn new_game() -> GameState {
    game::initial_state()
}

pub fn from_fen(fen: &str) -> Result<GameState, EngineError> {
    fen::from_fen(fen)
}

pub fn legal_moves(state: &GameState, square: Square) -> Vec<Move> {
    move_gen::generate_legal_moves_for_square(state, square)
}

pub fn apply_move(state: &GameState, input: MoveInput) -> Result<MoveResult, EngineError> {
    let result = game::apply_move_to_state(state, input)?;
    Ok(MoveResult {
        state: result.state,
        move_applied: result.move_applied,
    })
}

pub fn status(state: &GameState) -> GameStatus {
    rules::evaluate_status(state)
}

pub fn to_fen(state: &GameState) -> String {
    fen::to_fen(state)
}

#[cfg(test)]
#[path = "tests/legal_moves.rs"]
mod legal_moves_test;

#[cfg(test)]
#[path = "tests/checkmate.rs"]
mod checkmate_test;

#[cfg(test)]
#[path = "tests/stalemate.rs"]
mod stalemate_test;
