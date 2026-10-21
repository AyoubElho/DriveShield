# DriveShield

DriveShield is a local-first Electron desktop app for reviewing removable drives before opening their files. It provides a clear, modern workspace for inspecting a mounted USB drive or any folder without sending its contents to a server.

> DriveShield is an original project. It was informed only by broad removable-media security feature categories—not another product's source code, branding, assets, or interface.

## Features

- Inspect a mounted USB drive or a folder you choose.
- Flag common USB-risk indicators: `autorun.inf`, executable and script files, shortcuts, symbolic links, and dot-prefixed hidden folders on Linux/macOS.
- Review findings by severity in the app.
- Remove only the explicitly flagged files after a separate confirmation. Hidden folders are never automatically removed.
- Export the current inspection as a JSON report to a location you choose.
- Switch between polished dark and light themes; the selected appearance is remembered locally.
- Work entirely locally—scan names, report data, and files are never uploaded.

## Important security note

DriveShield is a **heuristic inspection tool**, not an antivirus engine. A flagged file is not automatically malware, and a clean result does not guarantee that a drive is safe. Use trusted endpoint security software and keep backups before removing files.

## Requirements

- Node.js 20 or newer
- npm
- Linux, macOS, or Windows with Electron support

## Getting started

```bash
git clone <your-repository-url>
cd DriveShield
npm install
npm start
```

`npm start` builds the renderer and launches the Electron desktop app.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm start` | Build the app and launch DriveShield. |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production renderer build in `dist/`. |
| `npm test` | Run the scanner tests. |

## How inspection works

1. Choose a mounted USB drive or enter its path manually.
2. Run the read-only inspection.
3. Review every finding and its path.
4. Optionally export a JSON report.
5. If appropriate, use **Remove flagged files** and confirm the permanent deletion.

The scanner has a 20,000-entry safety limit so an unexpectedly large directory does not make the app unresponsive.

## Privacy

DriveShield does not make network requests. Folder selection, inspection, reports, theme preference, and removal actions are handled on the local machine.

## Development

The renderer is built with Vite, while Electron's main process provides the native folder picker and local filesystem operations.

```bash
npm test
npm run build
```

## License

Add a license before publishing or distributing this project publicly.
