use crate::board::{Piece, PieceColor, PieceKind, Square};
use crate::game::{GameState, Move};

fn is_within_bounds(file: i16, rank: i16) -> bool {
    (0..8).contains(&file) && (0..8).contains(&rank)
}

fn square_from_coords(file: i16, rank: i16) -> Option<Square> {
    if is_within_bounds(file, rank) {
        Some(Square {
            file: file as u8,
            rank: rank as u8,
        })
    } else {
        None
    }
}

fn piece_at(state: &GameState, square: Square) -> Option<Piece> {
    state.board[square.rank as usize][square.file as usize]
}

fn is_empty(state: &GameState, square: Square) -> bool {
    piece_at(state, square).is_none()
}

fn is_enemy_piece(state: &GameState, square: Square, color: PieceColor) -> bool {
    piece_at(state, square).is_some_and(|piece| piece.color != color)
}

fn promotion_pieces() -> [PieceKind; 4] {
    [
        PieceKind::Queen,
        PieceKind::Rook,
        PieceKind::Bishop,
        PieceKind::Knight,
    ]
}

fn push_move_with_optional_promotion(
    moves: &mut Vec<Move>,
    from: Square,
    to: Square,
    kind: PieceKind,
) {
    if kind == PieceKind::Pawn && (to.rank == 0 || to.rank == 7) {
        for promotion in promotion_pieces() {
            moves.push(Move {
                from,
                to,
                promotion: Some(promotion),
            });
        }
    } else {
        moves.push(Move {
            from,
            to,
            promotion: None,
        });
    }
}

fn generate_sliding_moves(
    state: &GameState,
    from: Square,
    color: PieceColor,
    directions: &[(i16, i16)],
    moves: &mut Vec<Move>,
) {
    for (df, dr) in directions {
        let mut file = from.file as i16 + df;
        let mut rank = from.rank as i16 + dr;

        while let Some(to) = square_from_coords(file, rank) {
            let target = piece_at(state, to);
            if let Some(target_piece) = target {
                if target_piece.color != color {
                    moves.push(Move {
                        from,
                        to,
                        promotion: None,
                    });
                }
                break;
            }

            moves.push(Move {
                from,
                to,
                promotion: None,
            });

            file += df;
            rank += dr;
        }
    }
}

fn king_home_rank(color: PieceColor) -> u8 {
    match color {
        PieceColor::White => 0,
        PieceColor::Black => 7,
    }
}

fn castling_rights_for_color(state: &GameState, color: PieceColor) -> (bool, bool) {
    match color {
        PieceColor::White => (
            state.castling_rights.white_king_side,
            state.castling_rights.white_queen_side,
        ),
        PieceColor::Black => (
            state.castling_rights.black_king_side,
            state.castling_rights.black_queen_side,
        ),
    }
}

fn add_castling_moves(state: &GameState, from: Square, color: PieceColor, moves: &mut Vec<Move>) {
    if from.file != 4 || from.rank != king_home_rank(color) {
        return;
    }

    let enemy = opposite(color);
    if is_square_attacked_by(state, from, enemy) {
        return;
    }

    let (king_side_allowed, queen_side_allowed) = castling_rights_for_color(state, color);

    if king_side_allowed {
        let f = Square {
            file: 5,
            rank: from.rank,
        };
        let g = Square {
            file: 6,
            rank: from.rank,
        };
        let rook_square = Square {
            file: 7,
            rank: from.rank,
        };

        let rook_ok = piece_at(state, rook_square)
            .is_some_and(|piece| piece.color == color && piece.kind == PieceKind::Rook);

        if rook_ok
            && is_empty(state, f)
            && is_empty(state, g)
            && !is_square_attacked_by(state, f, enemy)
            && !is_square_attacked_by(state, g, enemy)
        {
            moves.push(Move {
                from,
                to: g,
                promotion: None,
            });
        }
    }

    if queen_side_allowed {
        let b = Square {
            file: 1,
            rank: from.rank,
        };
        let c = Square {
            file: 2,
            rank: from.rank,
        };
        let d = Square {
            file: 3,
            rank: from.rank,
        };
        let rook_square = Square {
            file: 0,
            rank: from.rank,
        };

        let rook_ok = piece_at(state, rook_square)
            .is_some_and(|piece| piece.color == color && piece.kind == PieceKind::Rook);

        if rook_ok
            && is_empty(state, b)
            && is_empty(state, c)
            && is_empty(state, d)
            && !is_square_attacked_by(state, d, enemy)
            && !is_square_attacked_by(state, c, enemy)
        {
            moves.push(Move {
                from,
                to: c,
                promotion: None,
            });
        }
    }
}

pub fn generate_pseudo_legal_moves_for_square(state: &GameState, square: Square) -> Vec<Move> {
    let Some(piece) = piece_at(state, square) else {
        return Vec::new();
    };

    let mut moves = Vec::new();

    match piece.kind {
        PieceKind::Pawn => {
            let direction = if piece.color == PieceColor::White {
                1
            } else {
                -1
            };
            let start_rank = if piece.color == PieceColor::White {
                1
            } else {
                6
            };

            if let Some(one_step) =
                square_from_coords(square.file as i16, square.rank as i16 + direction)
            {
                if is_empty(state, one_step) {
                    push_move_with_optional_promotion(&mut moves, square, one_step, piece.kind);

                    if square.rank == start_rank {
                        if let Some(two_step) = square_from_coords(
                            square.file as i16,
                            square.rank as i16 + (2 * direction),
                        ) {
                            if is_empty(state, two_step) {
                                moves.push(Move {
                                    from: square,
                                    to: two_step,
                                    promotion: None,
                                });
                            }
                        }
                    }
                }
            }

            for df in [-1, 1] {
                if let Some(capture_square) =
                    square_from_coords(square.file as i16 + df, square.rank as i16 + direction)
                {
                    if is_enemy_piece(state, capture_square, piece.color) {
                        push_move_with_optional_promotion(
                            &mut moves,
                            square,
                            capture_square,
                            piece.kind,
                        );
                    }
                }
            }

            if let Some(en_passant_target) = state.en_passant_target {
                for df in [-1, 1] {
                    if let Some(capture_square) =
                        square_from_coords(square.file as i16 + df, square.rank as i16 + direction)
                    {
                        if capture_square == en_passant_target {
                            if let Some(adjacent_square) =
                                square_from_coords(square.file as i16 + df, square.rank as i16)
                            {
                                if piece_at(state, adjacent_square).is_some_and(|p| {
                                    p.kind == PieceKind::Pawn && p.color != piece.color
                                }) {
                                    moves.push(Move {
                                        from: square,
                                        to: capture_square,
                                        promotion: None,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        PieceKind::Knight => {
            let deltas = [
                (-2, -1),
                (-2, 1),
                (-1, -2),
                (-1, 2),
                (1, -2),
                (1, 2),
                (2, -1),
                (2, 1),
            ];

            for (df, dr) in deltas {
                if let Some(to) =
                    square_from_coords(square.file as i16 + df, square.rank as i16 + dr)
                {
                    let target = piece_at(state, to);
                    if target.is_none() || target.is_some_and(|p| p.color != piece.color) {
                        moves.push(Move {
                            from: square,
                            to,
                            promotion: None,
                        });
                    }
                }
            }
        }
        PieceKind::Bishop => {
            generate_sliding_moves(
                state,
                square,
                piece.color,
                &[(-1, -1), (1, -1), (-1, 1), (1, 1)],
                &mut moves,
            );
        }
        PieceKind::Rook => {
            generate_sliding_moves(
                state,
                square,
                piece.color,
                &[(-1, 0), (1, 0), (0, -1), (0, 1)],
                &mut moves,
            );
        }
        PieceKind::Queen => {
            generate_sliding_moves(
                state,
                square,
                piece.color,
                &[
                    (-1, -1),
                    (1, -1),
                    (-1, 1),
                    (1, 1),
                    (-1, 0),
                    (1, 0),
                    (0, -1),
                    (0, 1),
                ],
                &mut moves,
            );
        }
        PieceKind::King => {
            let deltas = [
                (-1, -1),
                (0, -1),
                (1, -1),
                (-1, 0),
                (1, 0),
                (-1, 1),
                (0, 1),
                (1, 1),
            ];

            for (df, dr) in deltas {
                if let Some(to) =
                    square_from_coords(square.file as i16 + df, square.rank as i16 + dr)
                {
                    let target = piece_at(state, to);
                    if target.is_none() || target.is_some_and(|p| p.color != piece.color) {
                        moves.push(Move {
                            from: square,
                            to,
                            promotion: None,
                        });
                    }
                }
            }

            add_castling_moves(state, square, piece.color, &mut moves);
        }
    }

    moves
}

fn apply_move_unchecked(state: &GameState, mv: &Move) -> GameState {
    let mut next = state.clone();
    let Some(mut moving_piece) = piece_at(&next, mv.from) else {
        return next;
    };

    let target_before = piece_at(&next, mv.to);
    let is_en_passant_capture = moving_piece.kind == PieceKind::Pawn
        && mv.from.file != mv.to.file
        && target_before.is_none()
        && state.en_passant_target == Some(mv.to);

    next.board[mv.from.rank as usize][mv.from.file as usize] = None;

    if is_en_passant_capture {
        let capture_rank = if moving_piece.color == PieceColor::White {
            mv.to.rank as i16 - 1
        } else {
            mv.to.rank as i16 + 1
        };

        if let Some(capture_square) = square_from_coords(mv.to.file as i16, capture_rank) {
            next.board[capture_square.rank as usize][capture_square.file as usize] = None;
        }
    }

    if moving_piece.kind == PieceKind::King && (mv.from.file as i16 - mv.to.file as i16).abs() == 2
    {
        let rank = mv.from.rank;
        if mv.to.file > mv.from.file {
            let rook_from = Square { file: 7, rank };
            let rook_to = Square { file: 5, rank };
            let rook = next.board[rook_from.rank as usize][rook_from.file as usize];
            next.board[rook_from.rank as usize][rook_from.file as usize] = None;
            next.board[rook_to.rank as usize][rook_to.file as usize] = rook;
        } else {
            let rook_from = Square { file: 0, rank };
            let rook_to = Square { file: 3, rank };
            let rook = next.board[rook_from.rank as usize][rook_from.file as usize];
            next.board[rook_from.rank as usize][rook_from.file as usize] = None;
            next.board[rook_to.rank as usize][rook_to.file as usize] = rook;
        }
    }

    if let Some(promotion) = mv.promotion {
        moving_piece.kind = promotion;
    }

    next.board[mv.to.rank as usize][mv.to.file as usize] = Some(moving_piece);

    let moved_color = next.active_color;
    next.active_color = opposite(next.active_color);

    if moved_color == PieceColor::Black {
        next.fullmove_number += 1;
    }

    if moving_piece.kind == PieceKind::Pawn || target_before.is_some() || is_en_passant_capture {
        next.halfmove_clock = 0;
    } else {
        next.halfmove_clock += 1;
    }

    next.en_passant_target = if moving_piece.kind == PieceKind::Pawn
        && (mv.to.rank as i16 - mv.from.rank as i16).abs() == 2
    {
        Some(Square {
            file: mv.from.file,
            rank: ((mv.from.rank as u16 + mv.to.rank as u16) / 2) as u8,
        })
    } else {
        None
    };

    next
}

fn find_king_square(state: &GameState, color: PieceColor) -> Option<Square> {
    for rank in 0u8..8 {
        for file in 0u8..8 {
            let square = Square { file, rank };
            if piece_at(state, square)
                .is_some_and(|piece| piece.color == color && piece.kind == PieceKind::King)
            {
                return Some(square);
            }
        }
    }

    None
}

fn path_clear_between(
    state: &GameState,
    from: Square,
    to: Square,
    step_file: i16,
    step_rank: i16,
) -> bool {
    let mut file = from.file as i16 + step_file;
    let mut rank = from.rank as i16 + step_rank;

    while file != to.file as i16 || rank != to.rank as i16 {
        let Some(square) = square_from_coords(file, rank) else {
            return false;
        };

        if piece_at(state, square).is_some() {
            return false;
        }

        file += step_file;
        rank += step_rank;
    }

    true
}

fn piece_attacks_square(state: &GameState, from: Square, target: Square, piece: Piece) -> bool {
    let df = target.file as i16 - from.file as i16;
    let dr = target.rank as i16 - from.rank as i16;

    match piece.kind {
        PieceKind::Pawn => {
            let direction = if piece.color == PieceColor::White {
                1
            } else {
                -1
            };
            dr == direction && (df == -1 || df == 1)
        }
        PieceKind::Knight => {
            let adf = df.abs();
            let adr = dr.abs();
            (adf == 1 && adr == 2) || (adf == 2 && adr == 1)
        }
        PieceKind::Bishop => {
            if df.abs() != dr.abs() || df == 0 {
                return false;
            }
            let step_file = if df > 0 { 1 } else { -1 };
            let step_rank = if dr > 0 { 1 } else { -1 };
            path_clear_between(state, from, target, step_file, step_rank)
        }
        PieceKind::Rook => {
            if df != 0 && dr != 0 {
                return false;
            }

            if df == 0 {
                let step_rank = if dr > 0 { 1 } else { -1 };
                path_clear_between(state, from, target, 0, step_rank)
            } else {
                let step_file = if df > 0 { 1 } else { -1 };
                path_clear_between(state, from, target, step_file, 0)
            }
        }
        PieceKind::Queen => {
            if df == 0 || dr == 0 {
                let step_file = if df == 0 {
                    0
                } else if df > 0 {
                    1
                } else {
                    -1
                };
                let step_rank = if dr == 0 {
                    0
                } else if dr > 0 {
                    1
                } else {
                    -1
                };
                path_clear_between(state, from, target, step_file, step_rank)
            } else if df.abs() == dr.abs() {
                let step_file = if df > 0 { 1 } else { -1 };
                let step_rank = if dr > 0 { 1 } else { -1 };
                path_clear_between(state, from, target, step_file, step_rank)
            } else {
                false
            }
        }
        PieceKind::King => df.abs() <= 1 && dr.abs() <= 1,
    }
}

pub fn is_square_attacked_by(state: &GameState, target: Square, by_color: PieceColor) -> bool {
    for rank in 0u8..8 {
        for file in 0u8..8 {
            let from = Square { file, rank };
            let Some(piece) = piece_at(state, from) else {
                continue;
            };

            if piece.color != by_color {
                continue;
            }

            if piece_attacks_square(state, from, target, piece) {
                return true;
            }
        }
    }

    false
}

pub fn is_in_check_for_color(state: &GameState, color: PieceColor) -> bool {
    let Some(king_square) = find_king_square(state, color) else {
        return false;
    };

    is_square_attacked_by(state, king_square, opposite(color))
}

pub fn generate_legal_moves_for_square(state: &GameState, square: Square) -> Vec<Move> {
    let Some(piece) = piece_at(state, square) else {
        return Vec::new();
    };

    if piece.color != state.active_color {
        return Vec::new();
    }

    generate_pseudo_legal_moves_for_square(state, square)
        .into_iter()
        .filter(|mv| {
            let next = apply_move_unchecked(state, mv);
            !is_in_check_for_color(&next, piece.color)
        })
        .collect()
}

pub fn is_legal_move(state: &GameState, from: Square, to: Square) -> bool {
    generate_legal_moves_for_square(state, from)
        .iter()
        .any(|mv| mv.to == to)
}

pub fn side_to_move_has_any_move(state: &GameState) -> bool {
    for rank in 0u8..8 {
        for file in 0u8..8 {
            let square = Square { file, rank };
            if !generate_legal_moves_for_square(state, square).is_empty() {
                return true;
            }
        }
    }

    false
}

pub fn opposite(color: PieceColor) -> PieceColor {
    match color {
        PieceColor::White => PieceColor::Black,
        PieceColor::Black => PieceColor::White,
    }
}
