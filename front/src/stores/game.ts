import { reactive } from 'vue'
import { defineStore } from 'pinia'
import type { GameState } from '../types/game'

export const useGameStore = defineStore('game', () => {
  const gameState = reactive<GameState>({
    movesHistory: [],
    boardDimension: 19
  })

  function updateGameState(newgameState: GameState) {
    gameState.movesHistory = newgameState.movesHistory
    gameState.boardDimension = newgameState.boardDimension
  }

  return {
    gameState, updateGameState
  }
})
