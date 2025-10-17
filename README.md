# NSTAR Chat Console

A model-agnostic, offline-first Progressive Web App that mirrors the conversational experience of ChatGPT while allowing you to connect to **any** compatible AI inference endpoint. The console is built with strict Clean Architecture boundaries, secure local persistence, and a refined dark UI optimised for desktops, tablets, and mobile devices.

## Key Features

- **Bring-your-own model** – configure OpenAI-compatible, Azure OpenAI, Anthropic, Ollama, or fully custom HTTP endpoints.
- **Hybrid security posture** – API credentials encrypted locally with AES-256 GCM, no telemetry, no external analytics.
- **Offline-first PWA** – installable, caches core assets with Workbox, continues to operate without a network connection.
- **ChatGPT-grade UX** – streaming responses, enter-to-send, Shift+Enter for newline, polished theming with blue highlights and orange call-to-action states.
- **Persistent conversations** – IndexedDB (Dexie) storage keeps your history on-device only.
- **Clean Architecture** – strict separation of domain, data, and presentation layers with dependency inversion at feature boundaries.
- **Theming & accessibility** – dark/light toggle, keyboard-friendly composer, high-contrast palette.

## Project Structure

```
src/
├── core/               # Cross-cutting concerns (storage crypto, Dexie database)
├── data/               # Repository implementations and HTTP gateways
├── domain/             # Entities, repository interfaces, use cases
├── presentation/       # React UI, state management, DI wiring
│   ├── app/            # App shell
│   ├── components/     # Feature-specific UI components
│   ├── di/             # Dependency container and context
│   ├── lib/            # Presentation utilities (e.g. class merging)
│   └── state/          # Zustand stores orchestrating use cases
├── styles/             # Tailwind entry point
└── tests               # (See src/**/ *.test.ts)
```

The codebase enforces dependency inversion: the React layer only depends on domain use-cases and never touches persistence or network primitives directly.

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm** (bundled with Node)

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm run dev
```

Visit `http://localhost:5173` to access the console. The PWA registers a service worker automatically; to test offline behaviour, open DevTools → Application → Service Workers and check "Offline".

### Production build

```bash
npm run build
npm run preview
```

`npm run preview` serves the production bundle with the offline-ready service worker.

## Configuring Models

1. Open the **Settings** panel from the header or sidebar.
2. Choose a preset (OpenAI compatible, Azure, Anthropic, Ollama, or Custom).
3. Provide the endpoint URL, deployment/model identifier, and credentials.
4. For custom integrations, define the HTTP method, optional headers (JSON), and an optional body template. The template supports `{{prompt}}`, `{{messages}}`, and `{{model}}` tokens.
5. Click **Save configuration**. Settings persist locally with encrypted API keys.

## Testing

Two levels of automated coverage ship with the project:

| Command | Description |
| --- | --- |
| `npm run test` | Runs Vitest unit coverage for core crypto, settings, and chat orchestration use cases. |
| `npm run test:e2e` | Executes Playwright headless browser tests against the dev server. |

> The Playwright suite starts `npm run dev` automatically. Ensure port 5173 is free before running.

## Security Notes

- API credentials are encrypted in the browser using AES-256 GCM with keys managed by the WebCrypto API and persisted in `localStorage`.
- Conversation transcripts never leave your device.
- Strict Content Security Policy is defined in `index.html` to disallow third-party scripts by default.
- HTTPS is strongly recommended when deploying the console.

## PWA Behaviour

- Registering a service worker via the Vite PWA plugin (`generateSW` strategy).
- Icons, manifest, and metadata live under `public/`.
- Background updates are auto-applied (`registerType: "autoUpdate"`).

## License

This project is provided without warranty. You are responsible for handling credentials and adhering to the usage terms of the AI providers you connect.
