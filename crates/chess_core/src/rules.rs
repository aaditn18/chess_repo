use crate::board::PieceColor;
use crate::game::{GameState, GameStatus};
use crate::move_gen::{is_in_check_for_color, opposite, side_to_move_has_any_move};

pub fn is_in_check(state: &GameState, color: PieceColor) -> bool {
    is_in_check_for_color(state, color)
}

pub fn evaluate_status(state: &GameState) -> GameStatus {
    let active = state.active_color;

    if side_to_move_has_any_move(state) {
        return GameStatus::InProgress;
    }

    if is_in_check(state, active) {
        GameStatus::Checkmate(opposite(active))
    } else {
        GameStatus::Stalemate(active)
    }
}
