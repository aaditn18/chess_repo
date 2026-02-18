use std::collections::BTreeSet;

use crate::board::{empty_board, Piece, PieceColor, PieceKind, Square};
use crate::game::{GameState, GameStatus, MoveInput};
use crate::{apply_move, legal_moves, new_game, CastlingRights};

fn custom_state(active_color: PieceColor) -> GameState {
    GameState {
        board: empty_board(),
        active_color,
        status: GameStatus::InProgress,
        halfmove_clock: 0,
        fullmove_number: 1,
        castling_rights: CastlingRights {
            white_king_side: false,
            white_queen_side: false,
            black_king_side: false,
            black_queen_side: false,
        },
        en_passant_target: None,
    }
}

fn set_piece(state: &mut GameState, square: &str, color: PieceColor, kind: PieceKind) {
    let square = Square::from_algebraic(square).expect("valid square");
    state.board[square.rank as usize][square.file as usize] = Some(Piece { color, kind });
}

fn to_set(moves: &[crate::Move]) -> BTreeSet<String> {
    moves.iter().map(|m| m.to.to_algebraic()).collect()
}

#[test]
fn white_pawn_has_single_and_double_push_from_start() {
    let state = new_game();
    let square = Square::from_algebraic("e2").expect("valid square");
    let moves = legal_moves(&state, square);
    let targets = to_set(&moves);

    assert!(targets.contains("e3"));
    assert!(targets.contains("e4"));
}

#[test]
fn knight_jumps_over_blocking_pieces() {
    let state = new_game();
    let square = Square::from_algebraic("b1").expect("valid square");
    let moves = legal_moves(&state, square);
    let targets = to_set(&moves);

    assert!(targets.contains("a3"));
    assert!(targets.contains("c3"));
    assert!(!targets.contains("d2"));
}

#[test]
fn bishop_has_no_legal_moves_when_blocked() {
    let state = new_game();
    let square = Square::from_algebraic("c1").expect("valid square");
    let moves = legal_moves(&state, square);
    assert!(moves.is_empty());
}

#[test]
fn king_side_castling_is_available_when_path_is_clear_and_safe() {
    let mut state = custom_state(PieceColor::White);
    set_piece(&mut state, "e1", PieceColor::White, PieceKind::King);
    set_piece(&mut state, "h1", PieceColor::White, PieceKind::Rook);
    set_piece(&mut state, "e8", PieceColor::Black, PieceKind::King);

    state.castling_rights.white_king_side = true;

    let king_square = Square::from_algebraic("e1").expect("valid square");
    let targets = to_set(&legal_moves(&state, king_square));

    assert!(targets.contains("g1"));
}

#[test]
fn king_side_castling_is_blocked_when_king_passes_through_check() {
    let mut state = custom_state(PieceColor::White);
    set_piece(&mut state, "e1", PieceColor::White, PieceKind::King);
    set_piece(&mut state, "h1", PieceColor::White, PieceKind::Rook);
    set_piece(&mut state, "a8", PieceColor::Black, PieceKind::King);
    set_piece(&mut state, "f8", PieceColor::Black, PieceKind::Rook);

    state.castling_rights.white_king_side = true;

    let king_square = Square::from_algebraic("e1").expect("valid square");
    let targets = to_set(&legal_moves(&state, king_square));

    assert!(!targets.contains("g1"));
}

#[test]
fn en_passant_is_generated_and_applied_correctly() {
    let mut state = custom_state(PieceColor::White);
    set_piece(&mut state, "e1", PieceColor::White, PieceKind::King);
    set_piece(&mut state, "e8", PieceColor::Black, PieceKind::King);
    set_piece(&mut state, "e5", PieceColor::White, PieceKind::Pawn);
    set_piece(&mut state, "d5", PieceColor::Black, PieceKind::Pawn);

    state.en_passant_target = Some(Square::from_algebraic("d6").expect("valid square"));

    let from = Square::from_algebraic("e5").expect("valid square");
    let to = Square::from_algebraic("d6").expect("valid square");

    let targets = to_set(&legal_moves(&state, from));
    assert!(targets.contains("d6"));

    let result = apply_move(
        &state,
        MoveInput {
            from,
            to,
            promotion: None,
        },
    )
    .expect("en passant should be legal");

    let d6 = Square::from_algebraic("d6").expect("valid square");
    let d5 = Square::from_algebraic("d5").expect("valid square");

    assert!(result.state.board[d6.rank as usize][d6.file as usize]
        .is_some_and(|piece| piece.color == PieceColor::White && piece.kind == PieceKind::Pawn));
    assert!(result.state.board[d5.rank as usize][d5.file as usize].is_none());
    assert!(matches!(result.state.active_color, PieceColor::Black));
    assert_eq!(result.state.halfmove_clock, 0);
    assert!(result.state.en_passant_target.is_none());
}

#[test]
fn illegal_move_is_rejected_when_in_check_and_not_resolving() {
    let mut state = custom_state(PieceColor::White);
    set_piece(&mut state, "e1", PieceColor::White, PieceKind::King);
    set_piece(&mut state, "a1", PieceColor::White, PieceKind::Rook);
    set_piece(&mut state, "e8", PieceColor::Black, PieceKind::Rook);
    set_piece(&mut state, "h8", PieceColor::Black, PieceKind::King);

    let from = Square::from_algebraic("a1").expect("valid square");
    let to = Square::from_algebraic("a2").expect("valid square");

    let result = apply_move(
        &state,
        MoveInput {
            from,
            to,
            promotion: None,
        },
    );

    assert!(result.is_err());
}
