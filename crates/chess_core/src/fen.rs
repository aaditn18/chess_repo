use crate::game::{initial_state, EngineError, GameState};

pub const START_POSITION_FEN: &str = "rn1qkbnr/pppbpppp/8/3p4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
pub const STANDARD_START_FEN: &str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

pub fn from_fen(fen: &str) -> Result<GameState, EngineError> {
    match fen.trim() {
        "startpos" | STANDARD_START_FEN => Ok(initial_state()),
        _ => Err(EngineError::UnsupportedFen),
    }
}

pub fn to_fen(state: &GameState) -> String {
    if state == &initial_state() {
        STANDARD_START_FEN.to_string()
    } else {
        "unsupported-fen-serialization".to_string()
    }
}
