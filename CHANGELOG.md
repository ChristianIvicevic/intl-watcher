# Changelog

## 1.3.1

### Patch Changes

- Update dependency type-fest to v5.4.4 ([#226](https://github.com/ChristianIvicevic/intl-watcher/pull/226)) by [@renovate](https://github.com/apps/renovate)

## 1.3.0

### Minor Changes

- Add `suppressExpressionWarnings` option to silence diagnostics for specific unsupported expression kinds ([#224](https://github.com/ChristianIvicevic/intl-watcher/pull/224)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  Unsupported expressions now include a hint in the diagnostic suggesting how to suppress the warning. Any suppression entry that does not match an expression encountered during a scan emits a warning to prompt cleanup of stale config.

### Patch Changes

- Update dependency type-fest to v5.4.2 ([#217](https://github.com/ChristianIvicevic/intl-watcher/pull/217)) by [@renovate](https://github.com/apps/renovate)

- Update dependency type-fest to v5.4.3 ([#222](https://github.com/ChristianIvicevic/intl-watcher/pull/222)) by [@renovate](https://github.com/apps/renovate)

## 1.2.1

### Patch Changes

- Fix logger to use appropriate console methods (`console.warn` and `console.error`) instead of `console.log` for warnings and errors by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

## 1.2.0

### Minor Changes

- Add single-run export function for use in custom scripts and CI/CD pipelines. ([#209](https://github.com/ChristianIvicevic/intl-watcher/pull/209)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  Added a new `syncTranslationKeys` export that performs a one-time synchronization without file watching. This enables integration into custom scripts, build processes, and CI/CD pipelines.

  **Example usage:**

  ```typescript
  // scripts/sync-translations.ts
  import { syncTranslationKeys } from "intl-watcher";

  syncTranslationKeys({
    dictionaryPaths: ["./i18n/en.json", "./i18n/de.json"],
  });
  ```

## 1.1.0

### Minor Changes

- Add configurable JSON indentation options. ([#205](https://github.com/ChristianIvicevic/intl-watcher/pull/205)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  Added two new configuration options to customize the indentation of generated JSON dictionary files:

  - **`useTabs`** (boolean, default: `true`) - Use tab characters for indentation
  - **`tabWidth`** (number, default: `4`) - Number of spaces per indentation level when `useTabs` is `false`

  **Example usage:**

  ```typescript
  // Use 2 spaces for indentation
  intlWatcher({
    useTabs: false,
    tabWidth: 2,
  });

  // Use 4 spaces for indentation
  intlWatcher({
    useTabs: false,
    tabWidth: 4,
  });

  // Use tabs (default behavior)
  intlWatcher({
    useTabs: true,
  });
  ```

  This change is fully backward compatible - existing configurations will continue to use tab indentation by default.

## 1.0.5

### Patch Changes

- Update dependency lodash to v4.17.23 ([#202](https://github.com/ChristianIvicevic/intl-watcher/pull/202)) by [@renovate](https://github.com/apps/renovate)

## 1.0.4

### Patch Changes

- Update dependency dedent to v1.7.1 ([#185](https://github.com/ChristianIvicevic/intl-watcher/pull/185)) by [@renovate](https://github.com/apps/renovate)

## 1.0.3

### Patch Changes

- Update dependency chokidar to v5 ([#176](https://github.com/ChristianIvicevic/intl-watcher/pull/176)) by [@renovate](https://github.com/apps/renovate)

## 1.0.2

### Patch Changes

- Update dependency debounce to v3 ([#158](https://github.com/ChristianIvicevic/intl-watcher/pull/158)) by [@renovate](https://github.com/apps/renovate)

## 1.0.1

### Patch Changes

- Update dependency ts-morph to v27.0.2 ([#141](https://github.com/ChristianIvicevic/intl-watcher/pull/141)) by [@renovate](https://github.com/apps/renovate)

## 1.0.0

### Major Changes

- 🎉 Version 1.0.0 Release ([#126](https://github.com/ChristianIvicevic/intl-watcher/pull/126)) by [@ChristianIvicevic](https://github.com/ChristianIvicevic)

  This release marks the first stable version of intl-watcher, establishing the public API that will be maintained with semantic versioning going forward.

  #### Breaking Changes

  - Removed deprecated `sourceDirectory` option (deprecated in v0.5.0)
  - Removed deprecated `sourceDirectories` option (deprecated in v0.6.0 in favor of `watchPaths`)
  - All configuration options now use their finalized names

  #### API Stability Guarantee

  As a v1.0 release, this version establishes the public API that will be maintained according to semantic versioning principles. Future updates will maintain backward compatibility within the same major version.

  #### Migration Guide

  ##### From v0.6.x

  - Replace any remaining usage of `sourceDirectories` with `watchPaths`
  - No other changes needed

  ##### From v0.5.x or Earlier

  - Replace `sourceDirectory` with `watchPaths` (as an array)
  - Replace `sourceDirectories` with `watchPaths` if you were using the newer API
  - Review the README for the complete set of current options

## 0.6.2

### Patch Changes

- Update dependency dedent to v1.7.0 ([#113](https://github.com/ChristianIvicevic/intl-watcher/pull/113)) by [@renovate](https://github.com/apps/renovate)

- Update dependency ts-morph to v27 ([#121](https://github.com/ChristianIvicevic/intl-watcher/pull/121)) by [@renovate](https://github.com/apps/renovate)

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
