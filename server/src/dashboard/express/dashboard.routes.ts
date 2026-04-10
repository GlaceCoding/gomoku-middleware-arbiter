import express from 'express'
import { arbiter } from '../main'
import { GameStatus, movesHistory } from '../../game'
import { InterruptReason } from '../../jumper/ajumper'

const dashboardRouter = express.Router() 

interface GameAiData {
  host: string
  interruptReason: InterruptReason | null
}

interface GameData {
  name: string
  gstatus: GameStatus
  turn: number
  blackAI: GameAiData
  whiteAI: GameAiData
}
type GamesData = GameData[]

type FullGameData = GameData & {
  movesHistory: movesHistory[]
}

dashboardRouter.get('/games', (req, res) => {
  const data: GamesData = []
  arbiter.games.forEach((game) => {
    data.push({
      name: game.name,
      gstatus: game.gstatus,
      turn: game.turn,
      blackAI: {
        host: game.blackAI?.host || 'blackAI',
        interruptReason: game.blackAI?.interruptReason || null
      },
      whiteAI: {
        host: game.whiteAI?.host || 'whiteAI',
        interruptReason: game.whiteAI?.interruptReason || null
      }
    })
  })
  res.json({
    data
  })
})

dashboardRouter.get('/game/:id', (req, res) => {
  const id = +req.params.id
  if (!(id in arbiter.games))
    return res.status(404).send('Not found.')
  const game = arbiter.games[id]
  const data: FullGameData = {
    name: game.name,
    gstatus: game.gstatus,
    turn: game.turn,
    movesHistory: game.movesHistory,
    blackAI: {
      host: game.blackAI?.host || 'blackAI',
      interruptReason: game.blackAI?.interruptReason || null
    },
    whiteAI: {
      host: game.whiteAI?.host || 'whiteAI',
      interruptReason: game.whiteAI?.interruptReason || null
    }
  }
  res.json(data)
})

dashboardRouter.get('/create-game', (req, res) => {
    arbiter.createGame()

    res.json({
        'done': true
    })
})

export default dashboardRouter
