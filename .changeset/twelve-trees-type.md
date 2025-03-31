---
"intl-watcher": patch
---

Support AST-based detection of translation functions.

  The previous implementation only relied on raw identifiers to find variables that are the result of calling known translation hooks. With the new implementation we're applying a type-safe way of finding them which makes it easier to support alternate ways of translations.
