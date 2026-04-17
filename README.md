# Gomoku Middleware Arbiter

A middleware service that orchestrates **Gomoku AI vs AI** matches (possibly running on **separate machines or isolated Docker containers**) and **adjudicates** rule conflicts to produce a reliable **final result** (winner/loser/draw) with full traceability.

**Default values:**
 - Board size: 19×19
 - First player: Black
 - Cell id: `id = y * board_size + x`

---

## Goals

- Run a match between **two Gomoku AIs**.
- Compute and expose the **final outcome**:
  - winner / loser
  - final status (win, loss, draw, resign, error, disqualification…)
- Handle **rule disagreements / illegal behavior**:
  - identify **which action** (which move / which turn) triggered the conflict
  - identify **which AI played** the move and **which side rejected/blocked** it
  - sub-goal: provide a way to **test/audit rule implementations** across AIs

---

## High-level Architecture

Notation:
- **m** = middleware multiplayer server / arena / arbiter
- **ia** = Gomoku AI server (AI + its local rules/engine)

The **middleware (m)**:
- creates and manages a **game session**
- alternates turns (AI1 then AI2)
- maintains the **canonical board state**
- requests a move from the current AI
- validates moves and game status (and/or compares validations)
- decides what happens in case of refusal or inconsistency
- produces **final results** + logs/replay

Each **AI (ia)** exposes an interface that allows:
- health/session checks (ping)
- session initialization (start)
- receiving opponent moves + current board context
- returning its next move (or reporting terminal status)

---

## Technical Specification

### Deployment / Isolation
- The two AIs can run:
  - on **two different PCs**
  - or in **two separate Docker containers** (isolation / “security”)
- The middleware can run locally or as a central service.

### Communication (one of)
- **HTTP**
- **WebSocket**
- **Wrapper CLI stdin/stdout**

---

## API (Middleware Arbiter to Gomoku binary)

### 1) `m2ia PING` — check gomoku state

**Purpose:** check that the AI server is reachable, ready or busy. If busy, check is consistent with the current session.

- **Response:**
  - `state` (enum class AiState)
    ```cpp
    enum class AiState : unsigned {
      OPEN = 1 << 0,    // 0001: Gomoku reachable and able to communicate
      READY = 1 << 1,   // 0010: Ready to launch a new game
      BUSY = 1 << 2     // 0100: In game or not (if not ready and not busy = unavailable)
    };
    ```
  - `session_id` (string or null) Session id of the current game (often a basic timestamp)

---

### 2) `m2ia START` — initialize a game session

**Purpose:** tell the AI to initialize a new match session.

- **Request data:**
  - `session_id`
  - `you_are` is `'black'` or `'white'`
  - `force` optionnal, if set, middleware want to force the game start (and the actual game to be reset)
  - middleware callback URL (`m_url`) so the AI knows where to respond/notify if needed
  - (optional) rule parameters (board size, variants, etc.)
  - ~~board size~~ (to confirm if variable)

- **Response:**
  - `{"done": "OK"}`
  - Error Status 400: For a bad request/missing query parameter
  - Error Status 403: If a game is already running

---

### 3) `m2ia PLAY` — send the last move and request the next move

**Purpose:** provide the last context and request the AI’s next move.

- **Request data:**
  - `session_id`
  - `move`: Last move played by foe (optionnal during the first turn)
  - `board`: Last board state (after the last foe move)
    ```cpp
    enum class Cell: uint8_t {
      EMPTY=0U,
      BLACK=1U,
      WHITE=2U
    };
    ```
  - `gstatus`:
    - `playing`: Game in progress ;
    - `black_win` or `white_win`: One side wins ;
    - `draw`: It is a draw.

- **Response: `as_played=false`**
  - `as_played=false`: If the current AI played
  - `because`: If `as_played=false`, value will be :
    - `self_error`: AI doesn't played because internal error ;
    - `foe_wrongmove`: Opp AI sends a wrong move ;
    - `board_doesntmatch`: The board state of the AI are different ;
    - `black_win` or `white_win`: Game end, one side wins ;
    - `draw`: Game end, it is a draw.
  - `msglog`: optionnal, message log

- **Response: `as_played=true`**
  - `as_played=true`: If the current AI played
  - `move`: Cell id of the move played
  - `board`: Last board state, array of 19×19 `Cell`s 
    ```cpp
    enum class Cell: uint8_t {
      EMPTY=0U,
      BLACK=1U,
      WHITE=2U
    };
    ```
  - `turn`: Number of turn played
  - `gstatus`:
    - `playing`: Game in progress ;
    - `black_win` or `white_win`: One side wins ;
    - `draw`: It is a draw.

- **Response error:**
  - Error Status 400: For a bad request/missing query parameter
  - Error Status 403: If no game is already running or sessionid doesn't match

---

### 1) `m2ia STOP` — Unlock gomoku state

**Purpose:** tell the AI that the match ended (you should reset sessionid, and turn false inGame boolean).

- **Response:**
  - `{"done": "OK"}`

---

## Full example

```log
GET http://blackAI/arbiter/ping
  query: none
  response: { state: 3, sessionId: null }

GET http://whiteAI/arbiter/ping
  query: none
  response: { state: 3, sessionId: null }

GET http://blackAI/arbiter/start
  query: force sessionid=1776365065870 you_are=black
  response: { done: 'OK' }

GET http://whiteAI/arbiter/start
  query: force sessionid=1776365065870 you_are=white
  response: { done: 'OK' }

GET http://blackAI/arbiter/play
  query: gstatus=playing sessionid=1776365065870 
  response: { as_played: true, move: 181, board: [ 0, 0, 0, ... ],
              turn: 1, gstatus: 'playing' }

GET http://whiteAI/arbiter/play
  query: board=0,0,0... move=181 gstatus=playing sessionid=1776365065870
  response: { as_played: true, move: 180, board: [ 0, 0, 0, ... ],
              turn: 2, gstatus: 'playing' }

GET http://blackAI/arbiter/play
  query: board=0,0,0... move=180 gstatus=playing sessionid=1776365065870
  response: { as_played: true, move: 179, board: [ 0, 0, 0, ... ],
              turn: 3, gstatus: 'playing' }

# ...

GET http://blackAI/arbiter/stop
  response: { done: 'OK' }

GET http://whiteAI/arbiter/stop
  response: { done: 'OK' }
```
