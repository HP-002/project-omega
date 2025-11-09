# CrowdSense UB – Mobile App

Real-time study-space crowd monitoring for the University at Buffalo, built with Expo and React Native. The app visualizes live occupancy levels pulled from a FastAPI backend so students can quickly find open spots across campus.

- Live crowd updates streamed over WebSockets with auto-reconnect handling.
- Theming system with light/dark palettes persisted via AsyncStorage.
- Pinned favorites synced locally for quick access across sessions.
- Dual presentation modes: animated list view and interactive campus map.
- Haptic feedback and rich UI polish optimized for Expo Go builds.

---

## Table of Contents
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [WebSocket Payload](#websocket-payload)
- [Feature Highlights](#feature-highlights)
- [Troubleshooting & Tips](#troubleshooting--tips)

---

## Architecture

The app layers presentation, state, and real-time data management through context providers and custom hooks:

- `WebSocketProvider` (`contexts/WebSocketContext.js`) opens a socket to the FastAPI backend, normalizes incoming messages, tracks connection state, and exposes helpers (`getCrowdData`, `getLocationsWithCrowd`).
- `FavoritesProvider` (`contexts/FavoritesContext.js`) persists pinned location IDs to `AsyncStorage`, exposing `togglePin` and `isPinned`.
- `ThemeProvider` (`contexts/ThemeContext.js`) stores the selected theme, provides palette tokens, and exposes `toggleTheme`.
- UI screens consume these providers:
  - `HomeScreen` renders animated cards (`AnimatedLocationCardExpoGo`) with live counts, filtering, and theme controls.
  - `LocationDetailScreen` showcases rich animations, occupancy summaries, and pinning.
  - `MapViewScreen` paints markers scaled by crowd levels and surfaces contextual callouts.
- `hooks/useWebSocket.js` abstracts native WebSocket behavior with reconnection, listener management, and JSON parsing.
- `constants/Locations.js` defines static metadata, helper mappers, and crowd-level utilities.
- `services/mockWebSocket.js` simulates backend traffic for offline UI testing.

---

## Project Structure

```
App/
├─ App.js                     # Entry point wiring providers + navigation
├─ components/
│  ├─ AnimatedLocationCardExpoGo.js
│  └─ PulseIndicatorExpoGo.js
├─ config/
│  └─ websocket.js            # WebSocket URL + mock toggle
├─ constants/
│  └─ Locations.js            # Campus metadata + helpers
├─ contexts/
│  ├─ FavoritesContext.js
│  ├─ ThemeContext.js
│  └─ WebSocketContext.js
├─ hooks/
│  └─ useWebSocket.js
├─ screens/
│  ├─ HomeScreen.js
│  ├─ LocationDetailScreen.js
│  └─ MapViewScreen.js
├─ services/
│  └─ mockWebSocket.js        # Mocked crowd data generator
└─ assets/                    # Location imagery and branding
```

---

## Getting Started

1. **Prerequisites**
   - Node.js ≥ 18 and npm ≥ 9.
   - Expo CLI (`npm install -g expo-cli`) or use `npx expo`.
   - Expo Go installed on a mobile device, or Android/iOS simulators configured.

2. **Install dependencies**
   ```bash
   cd App
   npm install
   ```

3. **Backend connectivity**
   - Ensure the FastAPI backend (see `Server/`) is running and exposes the WebSocket endpoint reachable by your device (same LAN or tunneled).

---

## Configuration

Edit `config/websocket.js`:

- `WS_URL`: point to your FastAPI WebSocket endpoint, e.g. `ws://<your-ip>:8000/client/ws/connect`.
- `USE_MOCK_DATA`: set to `true` to inject simulated data from `mockWebSocket.js` when the backend is not available (UI-only testing). Remember to flip back to `false` for production.

Expo Metro caches endpoints aggressively. After changing the URL, run `expo start -c` (or `npm run start`) to clear caches.

---

## Running the App

```bash
cd App
npm run start        # or npm run android / ios / web
```

- Scan the Metro QR code with Expo Go (physical device) or press `a`/`i` to launch Android/iOS simulators.
- The status indicator on `HomeScreen` shows cloud connectivity. A green cloud confirms an active WebSocket session.

---

## WebSocket Payload

The provider expects messages matching the backend contract. Example payload (array or single object) derived from the mock service:

```json
{
  "location_name": "Student Union",
  "timestamp": "2024-05-12T18:45:23.412Z",
  "people_detected": 12,
  "occupancy_percent": 55.0
}
```

`WebSocketContext` maps `location_name` to internal IDs via `getLocationIdByName`, converts `occupancy_percent` to the `low/medium/high` crowd levels, and injects timestamps for UI freshness indicators.

---

## Feature Highlights

- **Real-time insights**: Auto-refreshing crowd metrics with exponential backoff reconnection and listener multiplexing.
- **Smart favorites**: Pin frequently visited study spaces; filters and map markers reflect pinned state.
- **Map & list parity**: Consistent location metadata shown in animated cards and map callouts.
- **Adaptive theming**: Light/dark mode switch with persisted preference and contextual color tokens for cards, overlays, buttons, and map controls.
- **UX touches**: Haptic feedback, animated transitions, gradient backgrounds, and detail pages with live badge scaling when counts change.
- **Offline-friendly development**: Mock WebSocket service to validate UI without the backend.

---

## Troubleshooting & Tips

- **No data appearing**: Verify device and backend are on the same network; check console logs for connection errors emitted from `useWebSocket`.
- **Socket closing repeatedly**: Confirm `WS_URL` uses `ws://` (or `wss://` when TLS is enabled) and that firewalls permit the connection.
- **Assets missing**: Ensure the files in `assets/locations/` match the `require` paths defined in `constants/Locations.js`.
- **Theme not persisting**: Clear Expo storage (`expo start -c`) or reinstall Expo Go; `AsyncStorage` stores the theme under `@crowdsense_theme`.
- **Changing backend schema**: Update `getLocationIdByName` and the normalization logic within `WebSocketContext` to stay in sync with the server.
