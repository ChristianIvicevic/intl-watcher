# Changelog

## 0.6.1

### Patch Changes

- Fixes the detection of shorthand property assignments in server options. ([#88](https://github.com/ChristianIvicevic/intl-watcher/pull/88)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 0.6.0

### Minor Changes

- Introduce `watchPaths`, a clearer rename of `sourceDirectories` with identical behavior. ([#85](https://github.com/ChristianIvicevic/intl-watcher/pull/85)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  `sourceDirectories` is now deprecated and will be removed in the next major release.

## 0.5.0

### Minor Changes

- Add new `sourceDirectories` option that allows users to list multiple directories to track, and deprecate the old `sourceDirectory` option. ([#83](https://github.com/ChristianIvicevic/intl-watcher/pull/83)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 0.4.1

### Patch Changes

- Update dependency dedent to v1.6.0 ([#44](https://github.com/ChristianIvicevic/intl-watcher/pull/44)) by [@renovate](https://github.com/apps/renovate)

- Update dependency ts-morph to v26 ([#63](https://github.com/ChristianIvicevic/intl-watcher/pull/63)) by [@renovate](https://github.com/apps/renovate)

## 0.4.0

### Minor Changes

- Overhaul of configuration API by refactoring it into a discriminated union with clearer, more ergonomic names. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  ⚠️ **BREAKING CHANGE**
  Even though this is a minor bump (v0.x), these changes are not backward‑compatible.

## 0.3.3

### Patch Changes

- Significantly improve incremental scan performance on large projects, making subsequent runs much faster. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 0.3.2

### Patch Changes

- Introduce diagnostic warning for unsupported expressions. ([#28](https://github.com/ChristianIvicevic/intl-watcher/pull/28)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 0.3.1

### Patch Changes

- Remove ts-extras dependency to reduce package size. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

- Fixed an issue where combined template literal expressions containing property access (e.g. `` t(`${apiResponse.data}PropertyDescription`) ``) were not correctly resolved. The parser now properly handles property accesses in template literals so that dynamic parts retain their expected literal values. ([#22](https://github.com/ChristianIvicevic/intl-watcher/pull/22)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 0.3.0

### Minor Changes

- Support options passed to `next-intl`'s `getTranslation` function. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  In previous versions the plugin was only able to parse the

  ```
  getTranslations(namespace?: NestedKey)
  ```

  signature of `getTranslations`. This update now fully supports the

  ```
  getTranslations(opts?: { locale: Locale, namespace?: NestedKey })
  ```

  signature as well.

## 0.2.1

### Patch Changes

- Improve diagnostic for dynamic namespace usage. by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  Enhanced the error reporting for dynamic namespace values in translation functions. Instead of a generic message, diagnostics now include file location, code frame, and clearer context to help users identify and fix issues more efficiently. An example error looks like this:

  ```
   ⨯ src/app/fixtures/dynamic-namespaces.tsx:9:34 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ⨯ A dynamic namespace value was provided instead of a literal string.

    >  9 | const t = await getTranslations(getRandomNamespace())
         |                                 ^^^^^^^^^^^^^^^^^^^^
      10 |

    ℹ For reliable extraction of translation keys, please ensure that the namespace is defined
      as a static string literal (or a variable that unequivocally resolves to one).
  ```

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
