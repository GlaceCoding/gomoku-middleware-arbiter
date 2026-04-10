import Game from './game'
import defaultHTTPJumper from './jumper/defaultHTTPJumper'

export default class Arbiter {
  games: Game[] = []

  contructor() {
    console.log('start !')
  }

  async createGame() {
    console.log('Game created !')
    const game = new Game()
    const blackAI = new defaultHTTPJumper('127.0.0.1:9012', game)
    const whiteAI = new defaultHTTPJumper('127.0.0.1:9013', game)
    if (await game.start(blackAI, whiteAI))
      this.games.push(game)
  }
}
