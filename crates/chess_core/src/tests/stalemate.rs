use crate::board::{empty_board, Piece, PieceColor, PieceKind, Square};
use crate::game::{GameState, GameStatus};
use crate::{status, CastlingRights};

fn set_piece(state: &mut GameState, square: &str, color: PieceColor, kind: PieceKind) {
    let square = Square::from_algebraic(square).expect("valid square");
    state.board[square.rank as usize][square.file as usize] = Some(Piece { color, kind });
}

#[test]
fn detects_basic_stalemate_position() {
    let mut state = GameState {
        board: empty_board(),
        active_color: PieceColor::Black,
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
    };

    set_piece(&mut state, "h8", PieceColor::Black, PieceKind::King);
    set_piece(&mut state, "f7", PieceColor::White, PieceKind::King);
    set_piece(&mut state, "g6", PieceColor::White, PieceKind::Queen);

    assert!(matches!(
        status(&state),
        GameStatus::Stalemate(PieceColor::Black)
    ));
}
