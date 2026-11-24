# AegisGate Rampart — VS Code / Cursor Extension

> Local AI security — detect PII, secrets, XSS, and adversarial prompts before they leave your IDE.

This extension connects to [AegisGate Rampart](https://github.com/aegisgatesecurity/aegisgate-rampart) running on `localhost:8080` and shows inline warnings in your editor.

**Zero external comms. Zero data retention. localhost only.**

## Requirements

- [AegisGate Rampart](https://github.com/aegisgatesecurity/aegisgate-rampart) running locally on port 8080

```bash
# Start Rampart
./rampart --daemon
```

## Features

| Feature | Description |
|---------|-------------|
| **Auto-scan on edit** | Debounced scanning as you type (configurable interval) |
| **Scan on save** | Automatic scan when you save a file |
| **Scan Selection** | Select text → Command Palette → "Rampart: Scan Selected Text" |
| **Scan Document** | Command Palette → "Rampart: Scan Active Document" |
| **Inline diagnostics** | 🔐 PII · 💳 Financial · 🌍 International · 🔑 Secrets · ⚔️ XSS · 📋 Compliance |
| **Status bar** | Detection count + connection status (bottom right) |
| **Severity filtering** | Only show diagnostics at or above your chosen threshold |
| **Show Stats** | View proxy statistics (requests, detections, blocked) |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `aegisgate-rampart.proxyUrl` | `http://localhost:8080` | Rampart proxy URL (localhost only) |
| `aegisgate-rampart.autoScan` | `true` | Scan automatically on text changes |
| `aegisgate-rampart.scanDebounceMs` | `500` | Milliseconds to wait before scanning after edit |
| `aegisgate-rampart.scanOnSave` | `true` | Scan when saving a file |
| `aegisgate-rampart.severityThreshold` | `low` | Minimum severity to display (`low`, `medium`, `high`, `critical`) |
| `aegisgate-rampart.maxDiagnostics` | `50` | Maximum diagnostics per document |
| `aegisgate-rampart.languageIds` | *(many)* | Language IDs to auto-scan |
| `aegisgate-rampart.showStatusBar` | `true` | Show status bar indicator |

## Detection Categories

The extension displays 154 regex patterns from Rampart (neural ML detection was withdrawn 2026-11-23):

| Icon | Category | Detects |
|------|----------|---------|
| 🔐 | PII US Core | SSN, email, phone, DOB, name |
| 🔐 | PII US Extended | Driver license, passport, medical record |
| 💳 | PII Financial | Credit card (Luhn), bank account |
| 🌍 | PII International | National IDs for 15+ countries |
| 🔑 | Secrets | AWS keys, GitHub tokens, OAuth, JWT, database URLs |
| ⚔️ | XSS | Script injection, event handlers, data URIs |
| 📋 | Compliance | GDPR, HIPAA, PCI-DSS, SOX identifiers |
| 🧠 | ~~ML Threat~~ | WITHDRAWN 2026-11-23 — neural ML detection withdrawn (see [aegisgate-rampart docs/ML-WITHDRAWN.md](https://github.com/aegisgatesecurity/aegisgate-rampart/blob/main/docs/ML-WITHDRAWN.md)) |

## Privacy (12 Non-Negotiables)

This extension enforces the same 12 privacy rules as Rampart, Lens, and Platform:

1. **No prompt text stored** — text goes to localhost, results come back, nothing persisted
2. **No URLs logged**
3. **No page content stored**
4. **No PII stored**
5. **No credentials stored**
6. **No fingerprinting**
7. **No cross-site tracking**
8. **No provider metadata collected**
9. **No keystroke logging**
10. **No mouse tracking**
11. **No session IDs stored**
12. **No IP addresses logged**

**Air-gap mode**: When Rampart is not running, the extension shows "disconnected" status. No fallback, no phone-home, no telemetry.

## Product Family

| Product | Surface | Approach | Detection |
|---------|---------|----------|-----------|
| **Lens** | Browser | DOM blocking (before send) | 154 regex |
| **Rampart** | Desktop, CLI, IDE | HTTPS proxy (after send) | 154 regex |
| **Rampart Ext** | VS Code, Cursor | IDE diagnostics (localhost API) | Same engine via Rampart proxy |
| **Platform** | Server | API gateway | 154 regex |

**Lens blocks before send. Rampart alerts after send. Extension warns in the IDE.**

## Build & Test

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests (requires VS Code test runner)
npm test

# Package as .vsix
npm run package

# Lint
npm run lint
```

## Cursor Compatibility

This extension is fully compatible with [Cursor](https://cursor.sh). Install the `.vsix` file and it works identically — same detection engine, same localhost API, same zero-external-comms guarantee.

## License

Apache-2.0