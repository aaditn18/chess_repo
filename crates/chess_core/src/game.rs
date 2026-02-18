use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::board::{standard_start_board, Board, Piece, PieceColor, PieceKind, Square};
use crate::move_gen::generate_legal_moves_for_square;
use crate::rules::evaluate_status;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Move {
    pub from: Square,
    pub to: Square,
    pub promotion: Option<PieceKind>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MoveInput {
    pub from: Square,
    pub to: Square,
    pub promotion: Option<PieceKind>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CastlingRights {
    pub white_king_side: bool,
    pub white_queen_side: bool,
    pub black_king_side: bool,
    pub black_queen_side: bool,
}

impl CastlingRights {
    pub fn standard() -> Self {
        Self {
            white_king_side: true,
            white_queen_side: true,
            black_king_side: true,
            black_queen_side: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameStatus {
    InProgress,
    Checkmate(PieceColor),
    Stalemate(PieceColor),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GameState {
    pub board: Board,
    pub active_color: PieceColor,
    pub status: GameStatus,
    pub halfmove_clock: u32,
    pub fullmove_number: u32,
    pub castling_rights: CastlingRights,
    pub en_passant_target: Option<Square>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MoveResult {
    pub state: GameState,
    pub move_applied: Move,
}

#[derive(Debug, Error, Clone, PartialEq, Eq)]
pub enum EngineError {
    #[error("invalid square")]
    InvalidSquare,
    #[error("no piece at source square")]
    NoPieceAtSource,
    #[error("not active player's piece")]
    NotActivePlayersPiece,
    #[error("illegal move")]
    IllegalMove,
    #[error("unsupported fen")]
    UnsupportedFen,
}

pub fn initial_state() -> GameState {
    GameState {
        board: standard_start_board(),
        active_color: PieceColor::White,
        status: GameStatus::InProgress,
        halfmove_clock: 0,
        fullmove_number: 1,
        castling_rights: CastlingRights::standard(),
        en_passant_target: None,
    }
}

fn is_valid_promotion_piece(kind: PieceKind) -> bool {
    matches!(
        kind,
        PieceKind::Queen | PieceKind::Rook | PieceKind::Bishop | PieceKind::Knight
    )
}

fn normalize_promotion(
    piece: Piece,
    to: Square,
    requested: Option<PieceKind>,
) -> Result<Option<PieceKind>, EngineError> {
    let requires_promotion = piece.kind == PieceKind::Pawn && (to.rank == 0 || to.rank == 7);

    if !requires_promotion {
        if requested.is_some() {
            return Err(EngineError::IllegalMove);
        }
        return Ok(None);
    }

    let promotion = requested.unwrap_or(PieceKind::Queen);
    if !is_valid_promotion_piece(promotion) {
        return Err(EngineError::IllegalMove);
    }

    Ok(Some(promotion))
}

fn update_castling_rights(
    current: CastlingRights,
    moved_piece: Piece,
    from: Square,
    to: Square,
    is_capture: bool,
) -> CastlingRights {
    let mut rights = current;

    if moved_piece.kind == PieceKind::King {
        match moved_piece.color {
            PieceColor::White => {
                rights.white_king_side = false;
                rights.white_queen_side = false;
            }
            PieceColor::Black => {
                rights.black_king_side = false;
                rights.black_queen_side = false;
            }
        }
    }

    if moved_piece.kind == PieceKind::Rook {
        match (moved_piece.color, from.file, from.rank) {
            (PieceColor::White, 0, 0) => rights.white_queen_side = false,
            (PieceColor::White, 7, 0) => rights.white_king_side = false,
            (PieceColor::Black, 0, 7) => rights.black_queen_side = false,
            (PieceColor::Black, 7, 7) => rights.black_king_side = false,
            _ => {}
        }
    }

    if is_capture {
        match (to.file, to.rank) {
            (0, 0) => rights.white_queen_side = false,
            (7, 0) => rights.white_king_side = false,
            (0, 7) => rights.black_queen_side = false,
            (7, 7) => rights.black_king_side = false,
            _ => {}
        }
    }

    rights
}

pub fn apply_move_to_state(state: &GameState, input: MoveInput) -> Result<MoveResult, EngineError> {
    if !matches!(state.status, GameStatus::InProgress) {
        return Err(EngineError::IllegalMove);
    }

    let mut next = state.clone();

    let source = next.board[input.from.rank as usize][input.from.file as usize];
    let piece = source.ok_or(EngineError::NoPieceAtSource)?;

    if piece.color != next.active_color {
        return Err(EngineError::NotActivePlayersPiece);
    }

    let promotion = normalize_promotion(piece, input.to, input.promotion)?;

    let requested_move = Move {
        from: input.from,
        to: input.to,
        promotion,
    };

    let legal_moves = generate_legal_moves_for_square(&next, input.from);
    if !legal_moves.contains(&requested_move) {
        return Err(EngineError::IllegalMove);
    }

    let target_piece = next.board[input.to.rank as usize][input.to.file as usize];
    let is_en_passant_capture = piece.kind == PieceKind::Pawn
        && input.from.file != input.to.file
        && target_piece.is_none()
        && next.en_passant_target == Some(input.to);

    let is_capture = target_piece.is_some() || is_en_passant_capture;

    next.board[input.from.rank as usize][input.from.file as usize] = None;

    if is_en_passant_capture {
        let capture_rank = if piece.color == PieceColor::White {
            input.to.rank as i16 - 1
        } else {
            input.to.rank as i16 + 1
        };

        if (0..8).contains(&capture_rank) {
            next.board[capture_rank as usize][input.to.file as usize] = None;
        }
    }

    if piece.kind == PieceKind::King && (input.from.file as i16 - input.to.file as i16).abs() == 2 {
        let rook_rank = input.from.rank;
        if input.to.file > input.from.file {
            // King-side castling.
            let rook_from = Square {
                file: 7,
                rank: rook_rank,
            };
            let rook_to = Square {
                file: 5,
                rank: rook_rank,
            };
            let rook = next.board[rook_from.rank as usize][rook_from.file as usize];
            next.board[rook_from.rank as usize][rook_from.file as usize] = None;
            next.board[rook_to.rank as usize][rook_to.file as usize] = rook;
        } else {
            // Queen-side castling.
            let rook_from = Square {
                file: 0,
                rank: rook_rank,
            };
            let rook_to = Square {
                file: 3,
                rank: rook_rank,
            };
            let rook = next.board[rook_from.rank as usize][rook_from.file as usize];
            next.board[rook_from.rank as usize][rook_from.file as usize] = None;
            next.board[rook_to.rank as usize][rook_to.file as usize] = rook;
        }
    }

    let moved_piece = if let Some(promoted_kind) = requested_move.promotion {
        Piece {
            color: piece.color,
            kind: promoted_kind,
        }
    } else {
        piece
    };

    next.board[input.to.rank as usize][input.to.file as usize] = Some(moved_piece);

    next.castling_rights = update_castling_rights(
        next.castling_rights,
        piece,
        input.from,
        input.to,
        is_capture,
    );

    next.en_passant_target = if piece.kind == PieceKind::Pawn
        && (input.to.rank as i16 - input.from.rank as i16).abs() == 2
    {
        Some(Square {
            file: input.from.file,
            rank: ((input.from.rank as u16 + input.to.rank as u16) / 2) as u8,
        })
    } else {
        None
    };

    let moved_color = next.active_color;
    next.active_color = match next.active_color {
        PieceColor::White => PieceColor::Black,
        PieceColor::Black => PieceColor::White,
    };

    if moved_color == PieceColor::Black {
        next.fullmove_number += 1;
    }

    if piece.kind == PieceKind::Pawn || is_capture {
        next.halfmove_clock = 0;
    } else {
        next.halfmove_clock += 1;
    }

    next.status = evaluate_status(&next);

    Ok(MoveResult {
        state: next,
        move_applied: requested_move,
    })
}
