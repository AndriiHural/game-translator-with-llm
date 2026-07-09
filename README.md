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



This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
