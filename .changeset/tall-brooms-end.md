---
"intl-watcher": patch
---

Fixed an issue where combined template literal expressions containing property access (e.g. ``t(`${apiResponse.data}PropertyDescription`)``) were not correctly resolved. The parser now properly handles property accesses in template literals so that dynamic parts retain their expected literal values.