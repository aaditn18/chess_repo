use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PieceColor {
    White,
    Black,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PieceKind {
    Pawn,
    Knight,
    Bishop,
    Rook,
    Queen,
    King,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Piece {
    pub color: PieceColor,
    pub kind: PieceKind,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Square {
    pub file: u8,
    pub rank: u8,
}

impl Square {
    pub fn new(file: u8, rank: u8) -> Option<Self> {
        if file < 8 && rank < 8 {
            Some(Self { file, rank })
        } else {
            None
        }
    }

    pub fn from_algebraic(input: &str) -> Option<Self> {
        let bytes = input.as_bytes();
        if bytes.len() != 2 {
            return None;
        }

        let file = bytes[0].to_ascii_lowercase();
        let rank = bytes[1];
        if !(b'a'..=b'h').contains(&file) || !(b'1'..=b'8').contains(&rank) {
            return None;
        }

        Some(Self {
            file: file - b'a',
            rank: rank - b'1',
        })
    }

    pub fn to_algebraic(self) -> String {
        let file = (self.file + b'a') as char;
        let rank = (self.rank + b'1') as char;
        format!("{}{}", file, rank)
    }
}

pub type Board = [[Option<Piece>; 8]; 8];

pub fn empty_board() -> Board {
    [[None; 8]; 8]
}

pub fn standard_start_board() -> Board {
    let mut board = empty_board();

    for file in 0..8 {
        board[1][file] = Some(Piece {
            color: PieceColor::White,
            kind: PieceKind::Pawn,
        });
        board[6][file] = Some(Piece {
            color: PieceColor::Black,
            kind: PieceKind::Pawn,
        });
    }

    let back_rank = [
        PieceKind::Rook,
        PieceKind::Knight,
        PieceKind::Bishop,
        PieceKind::Queen,
        PieceKind::King,
        PieceKind::Bishop,
        PieceKind::Knight,
        PieceKind::Rook,
    ];

    for (file, kind) in back_rank.iter().enumerate() {
        board[0][file] = Some(Piece {
            color: PieceColor::White,
            kind: *kind,
        });
        board[7][file] = Some(Piece {
            color: PieceColor::Black,
            kind: *kind,
        });
    }

    board
}
