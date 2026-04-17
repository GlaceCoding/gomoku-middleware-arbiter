import ajumper, { AiState } from "./jumper/ajumper"

export enum Cell { EMPTY=0, BLACK=1, WHITE=2 };
export type GameStatus = `playing` | `black_win` | `white_win` | `draw`
export interface movesHistory {
  lastMove: number
  newBoard: Cell[]
}

export default class Game {
  name: string = new Date().toString()
  turn: number = 0
  gstatus: GameStatus = 'playing'
  movesHistory: movesHistory[] = []
  blackAI: ajumper | null = null
  whiteAI: ajumper | null = null

  reset() {
    this.turn = 0
    this.gstatus = 'playing'
    this.movesHistory = []
    if (this.blackAI)
      this.blackAI.interruptReason = null
    if (this.whiteAI)
      this.whiteAI.interruptReason = null
  }

  blackReady(): boolean {
    return !!(this.blackAI && this.blackAI.state & AiState.READY)
  }

  whiteReady(): boolean {
    return !!(this.whiteAI && this.whiteAI.state & AiState.READY)
  }

  async start(blackAI: ajumper, whiteAI: ajumper): Promise<boolean> {
    this.blackAI = blackAI
    this.whiteAI = whiteAI

    blackAI.setColor('black')
    whiteAI.setColor('white')
  
    await this.blackAI.ping()
    await this.whiteAI.ping()

    if (!this.blackReady() || !this.whiteReady()) {
      console.log('At least one AI is not ready.',
        'black is ' + (this.blackReady() ? '' : 'not ') + 'ready.',
        'white is ' + (this.whiteReady() ? '' : 'not ') + 'ready.')
      return false
    }
    console.log('Both AI are ready to play.')

    const sessionid = parseInt(new Date().getTime().toString()).toString()

    const s1 = await this.blackAI.start(sessionid)
    const s2 = await this.whiteAI.start(sessionid)

    if (!s1 || !s2 || !this.blackReady() || !this.whiteReady()) {
      console.log('Cannot start, at least one IA doesn\'t start. Output: black:', s1, 'white:', s2)
      return false
    }

    this.reset()

    this.play()
    return true
  }

  async play(): Promise<boolean> {
    if (!this.blackAI || !this.whiteAI)
      return false

    if (!await ((this.turn % 2) ? this.whiteAI : this.blackAI).play())
      return false

    this.turn++
    setTimeout(() => this.play(), 10)
    return true
  }

  async stop(): Promise<boolean> {
    if (!this.blackAI || !this.whiteAI)
      return false
    let bool = true
    bool = this.blackAI.stop() && bool
    bool = this.whiteAI.stop() && bool
    return bool
  }
}
