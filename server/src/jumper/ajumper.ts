import Game, { Cell, GameStatus } from "../game"

export enum AiState {
  OPEN = 1 << 0,    // 0001: Gomoku reachable and able to communicate
  READY = 1 << 1,   // 0010: Ready to launch a new game
  BUSY = 1 << 2    // 0100: In game or not (if not ready and not busy = unavailable)
}

export type InterruptReason = 'self_error' | 'foe_wrongmove' | 'board_doesntmatch' | 'black_win' | 'white_win' | 'draw'

export default abstract class ajumper {
  host: string
  game: Game
  color: 'black' | 'white' | null = null
  /**
   * FLAGS :
   *  1. OPEN:     Gomoku reachable and able to communicate
   *  2. READY:    Ready to launch a new game
   *  3. BUSY:     In game or not (if not ready and not busy = unavailable)
   */
  state: number = 0
  sessionid: string = ''
  interruptReason: InterruptReason | null = null

  constructor(host: string, game: Game) {
    this.host = host
    this.game = game
  }

  setColor(color: 'black' | 'white') {
    this.color = color
  }

  isReady2Start(): boolean {
    if (!this.color) {
      console.error('isReady2Start: AI color not set')
      return false
    }
    return true
  }

  async isStatus200(resp: Response): Promise<boolean> {
    if (resp.status !== 200) {
      console.error('[FETCH]', this.color + 'AI not reachable ! because', await resp.text())
      this.state = 0
      return false
    }
    return true
  }

  abstract ping(): Promise<boolean>;
  abstract start(sessionid: string): Promise<boolean>;
  abstract play(): Promise<boolean>;
  abstract stop(): Promise<boolean>;

  /**
   * Refresh AiState and if AiState.BUSY, check if sessionid is matching
   * @param state AiState Flag (OPEN, READY, BUSY)
   * @param sessionid 
   * @returns Always true
   */
  handlePing(state: number, sessionid: string): boolean {
    this.state = state

    // S'il est BUSY mais que c'est notre sessionid c'est qu'il est ready pour nous.
    if (sessionid && sessionid === this.sessionid
        && this.state & AiState.OPEN && this.state & AiState.BUSY) {
      this.state = AiState.OPEN | AiState.READY
    }

    return true
  }

  /**
   * Store sessionid
   * @param sessionid 
   * @returns Always true
   */
  handleStart(sessionid: string): boolean {
    this.sessionid = sessionid

    return true
  }

  /**
   * Store movement and gstatus in movesHistory
   * @param move Cell id representing the last move
   * @param board New board after the last move
   * @param gstatus GameStatus playing/win/draw
   * @returns Always true
   */
  handlePlay(move: number, board: Cell[], gstatus: GameStatus): boolean {
    this.game.movesHistory.push({
      lastMove: move,
      newBoard: board
    })
    this.game.gstatus = gstatus

    return true
  }

  /**
   * Handle interrupt (IA doesn't play because...)
   * @param because Interrupt Reason ('self_error' | 'foe_wrongmove' | 'board_doesntmatch' | 'black_win' | 'white_win' | 'draw')
   * @param msglog Debug log
   * @returns False to interrupt the play loop, True to continue the play loop
   */
  handleInterrupt(because: InterruptReason, msglog?: string): boolean {
    console.error('[PLAY]', this.color + 'AI not played because', because, msglog)
    const lastGameStatus = this.game.gstatus

    switch (because) {
      case 'self_error':
        this.game.gstatus = (this.color === 'black') ? 'white_win' : 'black_win'
        break;
      case 'black_win':
      case 'white_win':
        this.game.gstatus = (because === 'black_win') ? 'black_win' : 'white_win'
        return (lastGameStatus === 'playing')
      case 'foe_wrongmove':
      case 'board_doesntmatch':
        console.log('Interruption because', because) // TODO: Improve it
      case 'draw':
        this.game.gstatus = 'draw'
        break;
    }

    if (!this.game.stop()) {
      console.warn(this.game.name, ': game stopped with error.')
    }

    return false
  }
}
