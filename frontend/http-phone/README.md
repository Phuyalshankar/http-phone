# http-phone

Built with 🌊 **Dolphin Mobile Platform** — Pure Binary Native • No WebView • No Bridge

## Project Structure

```
http-phone/
├── pages/          ← App screens (HomeScreen, etc.)
├── components/     ← Reusable UI components
├── hooks/          ← Custom hooks (useAppState, etc.)
├── store/          ← State management
├── utils/          ← Shared utilities
├── assets/         ← Images, fonts, etc.
├── app.jsx         ← App entry point
├── server.js       ← Optional server-side logic
└── dolphin.config.js
```

## Getting Started

```bash
npm install
dolphin dev             # hot-patch dev server
dolphin build           # compile to .dolp bundle
dolphin build --android # compile + build APK
```
