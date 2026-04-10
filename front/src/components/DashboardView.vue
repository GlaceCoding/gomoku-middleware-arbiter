<script setup lang="ts">
import { onMounted, onUnmounted, type Ref, ref } from 'vue'

type GameStatus = `playing` | `black_win` | `white_win` | `draw`

interface GameAiData {
  host: string
}

interface GameData {
  name: string
  gstatus: GameStatus
  turn: number
  blackAI: GameAiData
  whiteAI: GameAiData
}
type GamesData = GameData[]

const games: Ref<GamesData, GamesData> = ref([])

let _loop_timeout = 0
onMounted(() => loop())
onUnmounted(() => clearTimeout(_loop_timeout))

async function loop() {
  try {
    const resp = await fetch(`http://${window.location.hostname}:9038/dashboard/games`)
    const data = await resp.json()
    games.value = data.data
  } catch (err) {
    console.error(err)
  }
  clearTimeout(_loop_timeout)
  _loop_timeout = setTimeout(loop, 8000)
}
 
async function createGame() {
  await fetch(`http://${window.location.hostname}:9038/dashboard/create-game`)
  setTimeout(() => loop(), 800)
}

const reload = () => window.location.reload()
</script>

<template>
<div class="layout">
  <div class="header">
    <div id="logo">
      <h1 @click="reload">Gomoku-Middleware-Arbiter</h1>
    </div>
  </div>
  <section>
    <template v-if="games?.length > 0">
      <ul v-for="(game, id) in games" :key="game.name">
        <li @click="$router.push(`/game/${id}`)">
          <h2>{{ game.name }}</h2>
          <div class="flex">
            <p class="kv">
              <span class="k">GameStatus:</span> <span class="v">{{ game.gstatus }}</span>
            </p>
            <p class="kv">
              <span class="k">Turn:</span> <span class="v">{{ game.turn }}</span>
            </p>
          </div>
          <div class="flex">
            <p class="kv">
              <span class="k">BlackAI:</span> <span class="v">{{ game.blackAI.host }}</span>
            </p>
            <p class="kv">
              <span class="k">WhiteAI:</span> <span class="v">{{ game.whiteAI.host }}</span>
            </p>
          </div>
        </li>
      </ul>
    </template>
    <template v-else>
      <p class="error">No game launched.</p>
    </template>
    <button @click="createGame">Start a game AI vs AI</button>
  </section>
</div>
</template>

<style scoped lang="less">
h1 {
  cursor: pointer;
  font-size: 42px;
}

.layout {
  max-width: var(--content-width);
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

#logo {
  position: relative;
  .desc {
    font-size: 0.8rem;
    position: absolute;
    right: -1rem;
    bottom: -0.2rem;
    color: var(--white-color);
  }
}

section {
  text-align: center;
  color: var(--text-color);
}

p.error {
  padding: 1rem;
}

button {
  margin: 20px auto;
}

ul, li {
  padding: 1rem 0;
}

ul li {
  cursor: pointer;
  padding: 0.8rem 3rem;
  outline: solid 0.165rem var(--accent-color);
  border-radius: 1.2rem;
  background-color: var(--primary-color);
  color: var(--bg-color);
  font: var(--ui-font);
  line-height: 1.2rem;
  &, span.v {
    transition: all 0.4s ease-in;
  }

  &:hover, &.reverse {
    background-color: var(--accent-color);
    color: var(--bg-color);
    span.v {
      color: var(--primary-color);
    }
  }
}

p.kv {
  span.k {
    font-weight: bold;
  }
  span.v {
    color: var(--accent-color);
  }
}

div.flex {
  display: flex;
  gap: 20px;
}
</style>
