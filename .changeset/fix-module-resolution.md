---
"intl-watcher": patch
---

Fix module resolution failure for consumers using CJS loaders (e.g. tsx) by adding a `exports` field and removing the non-standard `module` field.
