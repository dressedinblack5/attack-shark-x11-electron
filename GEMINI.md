# Project: Attack Shark X11 Driver (Electron)

This project provides a cross-platform driver and GUI application for configuring the **Attack Shark X11** gaming mouse. It is built using **Electron**, **Vue 3**, **TypeScript**, and **Vite**, with **Bun** as the package manager.

## Project Overview

- **Core Functionality**: USB HID driver for DPI, macros, polling rate, and lighting configuration.
- **UI Framework**: Vue 3 with TailwindCSS.
- **Build System**: Electron-Vite.
- **Runtime**: Node.js/Electron.

## Development Commands

Use `bun` for all package management and script execution.

| Command | Description |
| :--- | :--- |
| `bun dev` | Start development server with hot-reload. |
| `bun run build` | Build the project for production. |
| `bun run package` | Build and create installation artifacts (AppImage/deb). |
| `bun run lint` | Run ESLint across the codebase. |
| `bun run lint:fix` | Run ESLint and automatically fix issues. |
| `bun run format` | Check formatting with Prettier. |
| `bun run format:fix` | Format the codebase with Prettier. |
| `bun run typecheck` | Run TypeScript type checking. |

## Development Conventions

- **Package Manager**: Strictly use `bun` for installing packages and running scripts.
- **Code Style**:
    - Adhere to the configured `eslint` and `prettier` rules.
    - Code is automatically formatted and linted on commit via `husky` and `lint-staged`.
- **Project Structure**:
    - `src/main`: Main process code (driver logic).
    - `src/preload`: Preload scripts for IPC communication.
    - `src/renderer`: Frontend code (Vue components, assets).
    - `docs/`: Protocol documentation and analysis files.
- **Testing**: Place new tests in `__tests__/` directory.
