# Changelog

## 0.2.0

### Minor Changes

- The plugin now supports namespaced dictionary files, moving beyond the previous flat structure. ([#14](https://github.com/ChristianIvicevic/intl-watcher/pull/14)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  - Automatically creates new namespaces and nests translation keys within them.
  - Removes unused nested keys and completely deletes namespaces if they become empty.

## 0.1.3

### Patch Changes

- Support AST-based detection of translation functions. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  The previous implementation only relied on raw identifiers to find variables that are the result of calling known translation hooks. With the new implementation we're applying a type-safe way of finding them which makes it easier to support alternate ways of translations.

## [0.1.2](https://github.com/ChristianIvicevic/intl-watcher/compare/0.1.1...0.1.2) (2025-03-28)

### Bug Fixes

- support t.rich in tests and ensure tests don't fail due to modified references ([35e0cba](https://github.com/ChristianIvicevic/intl-watcher/commit/35e0cba066d13b0149004206e2c99abe4828a2b0))

## [0.1.1](https://github.com/ChristianIvicevic/intl-watcher/compare/0.1.0...0.1.1) (2025-03-28)

### Bug Fixes

- remove unnecessary floating point digits in timings ([4a4d457](https://github.com/ChristianIvicevic/intl-watcher/commit/4a4d4575ea012ae0462f9356eab57472d1572c57))

# 0.1.0 (2025-03-27)

### Features

- initial prototype of the plugin ([#6](https://github.com/ChristianIvicevic/intl-watcher/issues/6)) ([7bf1d86](https://github.com/ChristianIvicevic/intl-watcher/commit/7bf1d86bbb1bc6364ca0d566825d99cbdad7eca4))
- initialized repo ✨ ([d1c2fe2](https://github.com/ChristianIvicevic/intl-watcher/commit/d1c2fe276db306ee97f78071b34e07073cc1a4de))
