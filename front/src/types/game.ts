enum Cell { EMPTY=0, BLACK=1, WHITE=2 };

export interface movesHistory {
  lastMove: number
  newBoard: Cell[]
}

type GameState = {
    movesHistory: movesHistory[];
    boardDimension: number;
}

export { Cell }
export type { GameState };
