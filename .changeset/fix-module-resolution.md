---
"intl-watcher": patch
---

Fix module resolution for consumers using CJS loaders (e.g. tsx) by adding an `exports` field with correct relative `./` prefixes for all entry points.
