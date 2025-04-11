# ♟️ Chess Game - Frontend Planning (React + Vite)

---

## 🔧 Tech Stack

- **React + Vite**
- **chess.js** – for game rules/logic
- **react-chessboard / chessboardjsx** – for rendering the board
- **Socket.IO** – for real-time multiplayer
- **Axios** – for API communication
- **CSS Modules / Tailwind / Styled Components** – for styling

---

## 📜 Pages

### `Home.jsx`
- Form to enter username
- Options: Create or Join game
- Navigate to Lobby or Game

### `Game.jsx`
- Displays the chessboard
- Real-time move syncing via socket
- Player info & move history

---

## 🧱 Components

### `Chessboard.jsx`
- Uses `react-chessboard` / `chessboardjsx`
- Controlled by `chess.js` state
- Handles drag/drop or click-move
- Highlights valid moves

### `PlayerInfo.jsx`
- Shows player names
- Shows timers (optional)
- Displays current turn

### `Lobby.jsx`
- Shows game code and waiting players
- Start game button for host

---

## 🧠 Custom Hooks

### `useSocket.js`
- Connect to socket server
- Emit and listen to game events (move, join, start)
- Handle cleanup on disconnect

### `useGame.js`
- Integrates `chess.js`
- Maintains local game state
- Interfaces with backend via `gameService`

---

## 🔌 Services

### `api.js`
- Creates a configured `Axios` instance

### `gameService.js`
- `createGame()`
- `joinGame(code)`
- `makeMove(from, to)`
- Any other game-related API calls

---

## 🖼️ Assets Needed

Store in `public/assets/pieces/`:

- `white-pawn.png`
- `white-knight.png`
- `white-bishop.png`
- `white-rook.png`
- `white-queen.png`
- `white-king.png`
- `black-pawn.png`
- `black-knight.png`
- `black-bishop.png`
- `black-rook.png`
- `black-queen.png`
- `black-king.png`

Optional:
- `board.png` (custom board background or texture)

### Sources
- [Wikimedia Commons - Chess Pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces)
- [Lichess GitHub Assets](https://github.com/lichess-org/lila)

---

## 📦 External Libraries

- `react-chessboard` or `chessboardjsx` – Board rendering
- `chess.js` – Game logic engine
- `socket.io-client` – Multiplayer communication
- `axios` – API calls
- `classnames` – Conditional classNames
- (optional) `tailwindcss` or `styled-components` – Styling

---

## 🗓️ Development Roadmap

### Phase 1: Setup
- [ ] Create Vite project
- [ ] Setup routes (`/`, `/game`)
- [ ] Add assets and libraries

### Phase 2: Home & Lobby
- [ ] Implement `Home.jsx` to create/join game
- [ ] Implement `Lobby.jsx` to wait for opponent

### Phase 3: Game Board
- [ ] Integrate `chess.js` for board logic
- [ ] Render board using `react-chessboard`
- [ ] Display pieces based on FEN/state

### Phase 4: Multiplayer
- [ ] Use `useSocket` to sync moves in real-time
- [ ] Display opponent moves
- [ ] Handle disconnection/rejoin

### Phase 5: UI Polish
- [ ] Add turn indicator
- [ ] Add timer (optional)
- [ ] Style board and components
- [ ] Make responsive

---

## ✅ Done When...

- Players can create and join games
- Pieces can move legally with rules enforced
- Board updates live between two players
- UI is clean, interactive, and mobile-friendly

---

# 💡 Pro Tip

Start small → First single-player board  
Then → Multiplayer sync  
Finally → Polish UI and add features like timer, undo, resign, etc.

