---
"intl-watcher": minor
---

Add single-run export function for use in custom scripts and CI/CD pipelines.

Added a new `syncTranslationKeys` export that performs a one-time synchronization without file watching. This enables integration into custom scripts, build processes, and CI/CD pipelines.

**Example usage:**

```typescript
// scripts/sync-translations.ts
import { syncTranslationKeys } from 'intl-watcher'

syncTranslationKeys({
  dictionaryPaths: ['./i18n/en.json', './i18n/de.json'],
})
```
