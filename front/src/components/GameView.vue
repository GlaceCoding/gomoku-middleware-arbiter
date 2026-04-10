<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import bowlofstones from './BowlOfStones.vue'
import type { RefStringOrNull } from '@/types/vue'
import type { Cell } from '@/types/game'
import { getCellClass } from '@/helpers/helpers'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameStore = useGameStore()

const store = useGameStore()
const hoverBoard = ref(-1)
const selectedBoard = ref(-1)
const currentBoard = computed(() => {
 if (hoverBoard.value >= 0) {
   return hoverBoard.value
 } else if (selectedBoard.value >= 0) {
   return selectedBoard.value
 } else {
  return store.gameState.movesHistory.length - 1
 }
})
  
const board = computed(() => store.gameState.movesHistory[currentBoard.value]?.newBoard)
const blackCaptured = computed(() => 0)
const whiteCaptured = computed(() => 0)

const iso3D = ref(false)

const errorMessage: RefStringOrNull = ref(null)

const boardDimension = computed(() => gameStore.gameState.boardDimension || 19)
const grids = computed(() => {
  const arr: number[][] = []
  for (let y = 0; y < boardDimension.value; y++) {
    arr[y] = []
    for (let x = 0; x < boardDimension.value; x++) {
      arr[y]![x] = x + y * boardDimension.value
    }
  }
  return arr
})

onMounted(load)
onUnmounted(() => {
  clearTimeout(_load_timeout)
})

let _load_timeout = 0
async function load() {
  errorMessage.value = ''
  let gstatus = null
  try {
    const resp = await fetch(`http://${window.location.hostname}:9038/dashboard/game/${route.params.id}`)
    if (resp.status != 200)
      throw Error('STATUS NOT 200')
    const data = await resp.json()
    gstatus = data.gstatus
    gameStore.updateGameState({
      boardDimension: 19,
      movesHistory: data.movesHistory
    })
  } catch (err) {
    console.error((err as Error).message)
  }
  clearTimeout(_load_timeout)
  if (gstatus === 'playing')
    _load_timeout = setTimeout(load, 1000)
  else
    _load_timeout = setTimeout(load, 8000)
}
</script>

<template>
  <section>
    <div id="game">
      <div class="header">
        <div id="logo">
          <h1 @click="$router.push('/')">Gomoku-Middleware-Arbiter</h1>
        </div>
        <div class="hud">
          <div class="capture-card black">
            <div class="capture-bowl">
              <bowlofstones />
              <span class="capture-count">{{ blackCaptured }}</span>
            </div>
          </div>

          <div class="capture-card white">
            <div class="capture-bowl">
              <bowlofstones />
              <span class="capture-count">{{ whiteCaptured }}</span>
            </div>
          </div>
        </div>
      </div>
      <div id="error-parent">
        <p class="error" v-if="errorMessage" @click="() => errorMessage = null">Message : {{ errorMessage }}</p>
      </div>
      <!-- Gameboard -->
      <div id="gameboard">
        <div class="board" :class="{ iso3D }">
          <template v-if="board">
            <div v-for="(line, y) in grids" :key="y" class="line">
              <div v-for="(cid, x) in line" :key="x" class="cell">
                <div class="circle"
                :class="{ highlight: gameStore.gameState.movesHistory[currentBoard]?.lastMove == cid }"
                :data-type="getCellClass(board[cid] as Cell)"
                :title="`[${x}; ${y}] - id: ${cid}`"
                :id="cid.toString()" :key="cid.toString()"
                  ></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div id="sidebar">
      <ul>
        <li v-for="(move, id) in gameStore.gameState.movesHistory" :key="id"
          :class="{ reverse: currentBoard == id }"
          @click="() => selectedBoard = id"
          @mouseover="() => hoverBoard = id" @mouseleave="() => hoverBoard = -1">
          {{ id + 1 }}) {{ move.lastMove }}
        </li>
      </ul>
    </div>
  </section>
  <button id="isoButton" @click="() => iso3D = !iso3D">iso3D</button>
</template>

<style scoped lang="less">
h1 {
  cursor: pointer;
  font-size: 42px;
}

section {
  width: 100vw;
  height: 100vw;
  overflow: hidden;
  display: flex;
  justify-content: space-between;

  #game {
    width: 100%;
  }

  #gameboard {
    margin: 0 auto;
    width: fit-content;
  }

  #sidebar {
    width: 200px;
    height: 100%;
    overflow-y: auto;
    border: 1px solid var(--primary-color);
    ul li {
      padding: 0.4rem 1rem;
      color: var(--primary-color);
      cursor: pointer;
      &:nth-child(even) {
        background: var(--primary-color);
        color: var(--bg-color);
      }
      &:hover, &.reverse {
        background: var(--accent-color);
      }
    }
  }
}

.header {
  padding: 0.8rem 0;
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

.controles {
  padding: 0.3em;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hud {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.capture-card {
  display: flex;
  flex-direction: column;
  align-items: center;

  &.black {
    color: var(--black-color);
    .capture-count {
      color: var(--white-color);
    }
  }

  &.white {
    color: var(--white-color);
    .capture-count {
      color: var(--black-color);
    }
  }
}

.capture-bowl {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
}

.capture-count {
  position: absolute;
  font: var(--ui-font);
  font-size: 2.2em;
  pointer-events: none;
}

div#error-parent {
  position: relative;
}

p.error {
  background: indianred;
  padding: 1.2rem;
  text-align: center;
  color: white;
  transition: all 0.4s ease-in-out;
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 0.4;
  }
  position: absolute;
  width: 600px;
  top: 0px;
  z-index: 1000;
  left: 0px;
  right: 0px;
  margin: 0 auto;
}

div.board {
  // --celsize: min(40px, calc(100vw / 19));
  margin-top: calc(var(--celsize) / -2);
  margin-left: calc(var(--celsize) / -2);
  padding-bottom: calc(var(--celsize) / 2);
  padding-right: calc(var(--celsize) / 2);
  box-sizing: content-box;

  div.line {
    display: flex;

    &.preview div.cell {
      border-right: 1px solid green;
      border-bottom: 1px solid green;
    }
  }

  div.cell {
    width: var(--celsize);
    height: var(--celsize);
    line-height: var(--celsize / 2);
    border-right: 1px solid var(--line-color);
    border-bottom: 1px solid var(--line-color);
    text-align: center;

    position: relative;
    div.circle {
      --radius: calc(var(--celsize) / 1.5);
      position: absolute;
      left: calc(var(--celsize) - var(--radius) / 2);
      top: calc(var(--celsize) - var(--radius) / 2);
      width: calc(var(--radius));
      height: var(--radius);
      line-height: var(--radius);
      font-size: 8px;
      border-radius: var(--celsize);
      padding-top: 2px;
      background-color: var(--line-color);
      color: var(--text-color);
      text-align: center;
      cursor: pointer;
      z-index: 200;

      &.highlight {
        animation: scale-highlight 1s ease-in-out infinite;
        &[data-type=empty] {
          opacity: 1;
          transition: all 0.2s ease-in;
        }
      }

      @keyframes scale-highlight {
        from {
          transform: scale(1.2);
        }
        50% {
          transform: scale(1.4);
        }
        to {
          transform: scale(1.2);
        }
      }

      &[data-type=black], &[data-type=white] {
        --radius: calc(var(--celsize) * 0.75);

        background: var(--white-color);
        &::after {
          position: absolute;
          left: 0;
          top: 0;
          width: calc(var(--radius) * 0.8);
          height: calc(var(--radius) * 0.8);
          margin: calc(var(--radius) * 0.1);
          border: calc(var(--radius) * 0.08) solid var(--bg-color);
          border-radius: var(--celsize);
          box-sizing: border-box;
          content: ' ';
          z-index: 201;
        }
      }
      &[data-type=black] {
        background: var(--black-color);
        color: var(--white-color);
      }
      &[data-type=empty] {
        opacity: 0;
        transition: all 0.2s ease-in;
      }
      &[data-type=empty]:hover {
        opacity: 1;
      }
    }
  }

  div.preview div.circle[data-type=empty] {
    display: none;
  }

  div.line > div:nth-child(1).cell:nth-child(1) {
    border-bottom: none;
  }

  div.line:nth-child(1) > div.cell {
    border-right: none;
  }
}

div.board {
  transition:
    .4s ease-in-out transform,
    .4s ease-in-out box-shadow;
}

div.board.iso3D {
  margin-top: calc(var(--celsize) / -2);
  margin-left: calc(var(--celsize) / -2);
  padding-bottom: calc(var(--celsize) / 1);
  padding-right: calc(var(--celsize) / 1);
  position: relative;
  top: -40px;

  transform:
    rotateX(50deg)
    rotateZ(43deg);
  transform-style: flat;
  border-radius: 32px;
  box-shadow:
    1px 1px 0 1px #f9f9fb,
    -1px 0 28px 0 rgba(34, 33, 81, 0.01),
    28px 28px 28px 0 rgba(34, 33, 81, 0.25);
  .circle[data-type=white] {
    box-shadow:
      5px 5px 0px 0px var(--white-color),
      -1px 0 28px 0 rgba(34, 33, 81, 0.01),
      28px 28px 28px 0 rgba(34, 33, 81, 0.25);
  }
  .circle[data-type=black] {
    box-shadow:
      5px 5px 0px 0px var(--black-color),
      -1px 0 28px 0 rgba(34, 33, 81, 0.01),
      28px 28px 28px 0 rgba(34, 33, 81, 0.25);
  }
}

#isoButton {
  background: none;
  color: var(--white-color);
  z-index: 1000;
  outline: none;
  cursor: pointer;
  position: fixed;
  bottom: 0;
  left: 0;
}
</style>
