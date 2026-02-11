---
"intl-watcher": minor
---

Add `suppressExpressionWarnings` option to silence diagnostics for specific unsupported expression kinds

Unsupported expressions now include a hint in the diagnostic suggesting how to suppress the warning. Any suppression entry that does not match an expression encountered during a scan emits a warning to prompt cleanup of stale config.
