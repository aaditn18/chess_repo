use chess_core::{
    apply_move, from_fen, legal_moves, new_game, GameState, MoveInput, PieceKind, Square,
};
use wasm_bindgen::prelude::*;

fn parse_square(square: &str) -> Result<Square, JsValue> {
    Square::from_algebraic(square).ok_or_else(|| JsValue::from_str("invalid square"))
}

fn parse_promotion(promotion: Option<String>) -> Result<Option<PieceKind>, JsValue> {
    match promotion.as_deref() {
        None => Ok(None),
        Some("q") | Some("Q") => Ok(Some(PieceKind::Queen)),
        Some("r") | Some("R") => Ok(Some(PieceKind::Rook)),
        Some("b") | Some("B") => Ok(Some(PieceKind::Bishop)),
        Some("n") | Some("N") => Ok(Some(PieceKind::Knight)),
        Some(_) => Err(JsValue::from_str("invalid promotion piece")),
    }
}

fn to_js_value<T: serde::Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value)
        .map_err(|err| JsValue::from_str(&format!("serialization error: {}", err)))
}

#[wasm_bindgen]
pub struct WasmGame {
    state: GameState,
}

#[wasm_bindgen]
impl WasmGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { state: new_game() }
    }

    #[wasm_bindgen(js_name = fromFen)]
    pub fn from_fen_js(fen: String) -> Result<WasmGame, JsValue> {
        let parsed = from_fen(&fen).map_err(|err| JsValue::from_str(&err.to_string()))?;
        Ok(Self { state: parsed })
    }

    #[wasm_bindgen(js_name = legalMoves)]
    pub fn legal_moves_js(&self, square: String) -> Result<JsValue, JsValue> {
        let square = parse_square(&square)?;
        let moves = legal_moves(&self.state, square)
            .into_iter()
            .map(|m| WasmMove {
                from: m.from.to_algebraic(),
                to: m.to.to_algebraic(),
                promotion: m.promotion.map(|p| format!("{:?}", p).to_lowercase()),
            })
            .collect::<Vec<_>>();

        to_js_value(&moves)
    }

    #[wasm_bindgen(js_name = applyMove)]
    pub fn apply_move_js(
        &mut self,
        from: String,
        to: String,
        promotion: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let from = parse_square(&from)?;
        let to = parse_square(&to)?;
        let promotion = parse_promotion(promotion)?;

        let result = apply_move(
            &self.state,
            MoveInput {
                from,
                to,
                promotion,
            },
        )
        .map_err(|err| JsValue::from_str(&err.to_string()))?;

        self.state = result.state;
        to_js_value(&self.state)
    }

    pub fn state(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.state)
    }
}

#[derive(serde::Serialize)]
struct WasmMove {
    from: String,
    to: String,
    promotion: Option<String>,
}
