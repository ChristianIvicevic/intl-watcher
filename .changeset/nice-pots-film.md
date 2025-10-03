---
"intl-watcher": major
---

## 🎉 Version 1.0.0 Release

This release marks the first stable version of intl-watcher, establishing the public API that will be maintained with semantic versioning going forward.

### Breaking Changes

- Removed deprecated `sourceDirectory` option (deprecated in v0.5.0)
- Removed deprecated `sourceDirectories` option (deprecated in v0.6.0 in favor of `watchPaths`)
- All configuration options now use their finalized names

### API Stability Guarantee

As a v1.0 release, this version establishes the public API that will be maintained according to semantic versioning principles. Future updates will maintain backward compatibility within the same major version.

### Migration Guide

#### From v0.6.x

- Replace any remaining usage of `sourceDirectories` with `watchPaths`
- No other changes needed

#### From v0.5.x or Earlier

- Replace `sourceDirectory` with `watchPaths` (as an array)
- Replace `sourceDirectories` with `watchPaths` if you were using the newer API
- Review the README for the complete set of current options
