# Changelog

All notable changes to AegisGate Rampart Extension are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-08-07

### Added
- VS Code / Cursor extension for AegisGate Rampart
- Automatic text scanning on edit (debounced) and on save
- Manual commands: Scan Selection, Scan Document, Check Status, Show Stats, Clear Diagnostics
- Inline diagnostics with severity icons (🔐 PII, 💳 Financial, 🌍 International, 🔑 Secrets, ⚔️ XSS, 📋 Compliance, 🧠 ML)
- Status bar indicator (detection count, connection status)
- Configurable proxy URL, severity threshold, debounce interval, language filters
- Zero external dependencies — talks to localhost only
- TypeScript strict mode, ESLint
- Unit tests for client, scanner, and diagnostics