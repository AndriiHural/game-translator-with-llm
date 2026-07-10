# [UA] Game Translator

Game Translator — це застосунок для локального перекладу ігор за допомогою великих мовних моделей (LLM), запущених через Ollama.

Проєкт створений для автоматизації локалізації ігор різних рушіїв та форматів файлів із можливістю обробки великих обсягів тексту, збереження структури даних і подальшого редагування перекладу.

Основні цілі проєкту:

* працювати повністю локально без передачі даних стороннім сервісам;
* підтримувати різні формати файлів локалізації;
* використовувати будь-яку сумісну LLM-модель через Ollama;
* мінімізувати ручну роботу під час перекладу;
* забезпечити контроль якості перекладу та збереження оригінальної структури файлів.

Проєкт перебуває в активній розробці, і функціональність поступово розширюється.

# [EN] Game Translator

Game Translator is an application for translating games locally using Large Language Models (LLMs) powered by Ollama.

The project is designed to automate game localization by supporting multiple game engines and localization file formats while preserving the original data structure and handling large volumes of text efficiently.

## Goals

* Run entirely offline without sending data to external services.
* Support multiple localization file formats.
* Work with any Ollama-compatible LLM.
* Reduce the amount of manual work required for game localization.
* Preserve file structure and provide tools for translation quality control.

The project is currently under active development, and new features are being added continuously.

---

## Tech stack

* [Angular](https://angular.dev) 22 (standalone components) + [Angular Material](https://material.angular.io)
* [Ollama](https://ollama.com) as the local LLM backend (default: `http://localhost:11434`)
* [Vitest](https://vitest.dev) for unit tests

## Prerequisites

* [Node.js](https://nodejs.org) (LTS) and npm
* A running [Ollama](https://ollama.com) instance with the required models pulled.
  Model ids used by the app are defined in
  [`src/app/constants/models.ts`](src/app/constants/models.ts).

## Getting started

```bash
npm install      # install dependencies
npm start        # start the dev server at http://localhost:4200
```

The application reloads automatically whenever you modify a source file.

## Available scripts

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm start`     | Start the local dev server (`ng serve`).           |
| `npm run build` | Build the project into `dist/`.                    |
| `npm run watch` | Rebuild on change (development configuration).      |
| `npm test`      | Run unit tests with Vitest.                        |

## Supported formats

Each localization format is exposed as a route and backed by its own parser,
exporter, and prompt strategy:

| Format               | Route(s)                                          |
| -------------------- | ------------------------------------------------- |
| CSV                  | `/upload`, `/merge`                               |
| Naninovel            | `/naninovel`                                      |
| Unity MonoBehaviour  | `/monoBehaviour`                                  |
| RPG Maker            | `/rpgmaker`, `/rpgmaker/system`, `/rpgmaker/quality` |

## Project structure

```
src/app/
├── services/     # file parsers/exporters and the Ollama client
├── strategies/   # per-format prompt strategies
├── tokens/       # DI tokens wiring parser + exporter + strategy per route
├── constants/    # prompt templates and model ids
├── components/   # shared UI (e.g. translation table)
├── features/     # self-contained feature modules (RPG Maker quality editor)
└── rpg-marker/   # RPG Maker-specific parser/exporter/strategy
```

The app uses a strategy pattern: each route in
[`src/app/app.routes.ts`](src/app/app.routes.ts) provides three DI tokens
(`FILE_PARSER_TOKEN`, `FILE_EXPORT_TOKEN`, `PROMPT_STRATEGY_TOKEN`), so a single
upload component can drive every supported format. Adding a new format means adding
a parser, an exporter, a prompt strategy, and a route that provides all three.

## Additional resources

For more information on the Angular CLI, see the
[Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
