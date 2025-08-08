<h1 align="center">🌐 intl-watcher plugin for Next.js </h1>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/ChristianIvicevic/intl-watcher/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/ChristianIvicevic/intl-watcher" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/ChristianIvicevic/intl-watcher?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/ChristianIvicevic/intl-watcher/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/intl-watcher" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/intl-watcher?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

![Showcase](./assets/showcase.gif)

Automatically scans your Next.js project's source files to manage internationalization (i18n) translation keys.
It keeps your translation dictionaries up-to-date by extracting new keys, removing unused ones, and optionally partitioning keys into separate client and server dictionaries.

> [!NOTE]
> Primarily designed for use with `next-intl`, this plugin can technically be adapted for other i18n libraries or frameworks that share a similar dictionary structure and access pattern in code.

## Features

- **Automatic Extraction**: Scans your project's source code for i18n keys.
- **Namespace Support**: Handles nested i18n keys organized into namespaces for structured translations.
- **Dictionary Syncing**: Automatically updates JSON dictionaries with new translation keys.
- **Unused Keys Handling**: Warns or removes unused keys.
- **Client/Server Partitioning**: Separates translation keys into client-side and server-side bundles.
- **Debounced Scanning**: Efficiently handles rapid file changes.

## Installation

Install the package via npm, yarn or pnpm:
```bash
npm install intl-watcher
# or
yarn add intl-watcher
# or
pnpm add intl-watcher
```

## Usage

Wrap your Next.js configuration with the provided `createIntlWatcher` function:

```ts
// next.config.ts
import { createIntlWatcher } from 'intl-watcher'

const withIntlWatcher = createIntlWatcher({
	dictionaryPaths: ['./i18n/en.json', './i18n/de.json'],
})

export default withIntlWatcher({
	reactStrictMode: true,
	// other Next.js config options...
})
```

## Configuration Options

### Required Options

#### `dictionaryPaths`

- **Type:** `string[]`
- **Description:** Paths to JSON dictionary files for each language. These files will be managed and kept in sync with your source.

### Shared Optional Options

#### `defaultValue`

- **Type:** `(key: string) => string`
- **Default:**
  ```js
  (key) => `[NYT: ${key}]`
  ```
- **Description:** Function that generates a default translation for new keys.

#### `removeUnusedKeys`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When true, removes keys no longer found in source files; otherwise emits warnings.

#### `scanDelay`

- **Type:** `number`
- **Default:** `500`
- **Description:** Delay in milliseconds before re‑scanning after file changes.

#### `tsConfigFilePath`

- **Type:** `string`
- **Default:** `tsconfig.json`
- **Description:** Path to `tsconfig.json` for project file resolution.

#### `watchPaths`

- **Type:** `string[]`
- **Default:** `['./src']`
- **Description:** Paths that the plugin watches to trigger rescans.
This does not change which files belong to your TypeScript project; that is controlled by `tsconfig.json` via `tsConfigFilePath`.

> [!IMPORTANT]
> Deprecations (will be removed in the next major version):
>
> - `sourceDirectories` (previous name for an array of directories). Use `watchPaths` instead.
> - `sourceDirectory` (single directory). Use `watchPaths` instead.

### Non-Partitioning Mode (default)

#### `applyPartitioning`

- **Type:** `false`
- **Default:** `false`
- **Description:** Default mode where keys are not split.

#### `translationFunctions`

- **Type:** `string[]`
- **Default:** `['useTranslations', 'getTranslations']`
- **Description:** Translation function name(s) to scan for keys.

### Partitioning Mode

#### `applyPartitioning`

- **Type**: `true`
- **Description**: Enables splitting translation keys into separate client and server bundles.

#### `partitioningOptions`

- **Type:** `{ clientFunction?: string; serverFunction?: string }`
- **Default:**
  ```json5
  {
    clientFunction: 'useTranslations',
    serverFunction: 'getTranslations'
  }
  ```
- **Description**: Function names to use for extracting client vs server translation keys.

## Dictionary Partitioning

When `applyPartitioning` is enabled, the plugin generates separate dictionaries for client and server bundles.
For example:

```
locales/
├── en.json
├── en.client.json
└── en.server.json
```

This enables optimized bundle sizes and clearer separation of translations by environment.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! 💖

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><img src="https://avatars.githubusercontent.com/u/45569997?v=4?s=100" width="100px;" alt="Christian Ivicevic"/><br /><sub><b>Christian Ivicevic</b></sub><br /><a href="https://github.com/ChristianIvicevic/intl-watcher/commits?author=ChristianIvicevic" title="Code">💻</a> <a href="#content-ChristianIvicevic" title="Content">🖋</a> <a href="https://github.com/ChristianIvicevic/intl-watcher/commits?author=ChristianIvicevic" title="Documentation">📖</a> <a href="#ideas-ChristianIvicevic" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-ChristianIvicevic" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-ChristianIvicevic" title="Maintenance">🚧</a> <a href="#projectManagement-ChristianIvicevic" title="Project Management">📆</a> <a href="#tool-ChristianIvicevic" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

