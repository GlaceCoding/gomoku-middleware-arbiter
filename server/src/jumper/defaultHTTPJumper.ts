import { arbiter } from '../dashboard/main'
import Game from '../game'
import ajumper from './ajumper'

export default class defaultHTTPJumper extends ajumper {
  constructor(host: string, game: Game) {
    console.log(host, 'for game:', game.name)

    super(host, game)
  }

  async ping(): Promise<boolean>  {
    const resp = await fetch(`http://${this.host}/arbiter/ping`)
    if (!await this.isStatus200(resp)) return false

    const data = await resp.json()

    return this.handlePing(+data.state, data.sessionid)
  }

  async start(sessionid: string): Promise<boolean> {
    if (!this.isReady2Start()) return false // Prevent wrong usage

    const objQuery: any = {
      you_are: this.color as string,
      sessionid
    }

    // We force the start for the first game (for dev when app restart)
    if (arbiter.games.length === 0)
      objQuery.force = ''

    const query = new URLSearchParams(objQuery).toString()

    const resp = await fetch(`http://${this.host}/arbiter/start?${query}`)
    if (!await this.isStatus200(resp)) return false

    const data = await resp.json()
    if (!data.done) return false

    return this.handleStart(sessionid)
  }

  async play(): Promise<boolean> {
    if (this.sessionid.length <= 0) return false

    const objQuery: any = {
      sessionid: this.sessionid,
      gstatus: this.game.gstatus
    }

    // We force the start for the first game (for dev when app restart)
    const len = this.game.movesHistory.length 
    if (len > 0) {
      const history = this.game.movesHistory[len - 1]
      objQuery.move = history.lastMove
      objQuery.board = history.newBoard.join(',')
    }

    const query = new URLSearchParams(objQuery).toString()

    const resp = await fetch(`http://${this.host}/arbiter/play?${query}`)
    if (!await this.isStatus200(resp)) return false

    const data = await resp.json()
    if (!data.as_played) {
      return this.handleInterrupt(data.because, data.msglog || undefined)
    } else {
      return this.handlePlay(data.move, data.board, data.gstatus)
    }
  }
}

