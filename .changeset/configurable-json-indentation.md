---
"intl-watcher": minor
---

Add configurable JSON indentation options.

Added two new configuration options to customize the indentation of generated JSON dictionary files:

- **`useTabs`** (boolean, default: `true`) - Use tab characters for indentation
- **`tabWidth`** (number, default: `4`) - Number of spaces per indentation level when `useTabs` is `false`

**Example usage:**

```typescript
// Use 2 spaces for indentation
intlWatcher({
  useTabs: false,
  tabWidth: 2
})

// Use 4 spaces for indentation
intlWatcher({
  useTabs: false,
  tabWidth: 4
})

// Use tabs (default behavior)
intlWatcher({
  useTabs: true
})
```

This change is fully backward compatible - existing configurations will continue to use tab indentation by default.
