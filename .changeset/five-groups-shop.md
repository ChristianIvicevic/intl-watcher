---
"intl-watcher": minor
---

Support options passed to `next-intl`'s `getTranslation` function.

  In previous versions the plugin was only able to parse the
  ```
  getTranslations(namespace?: NestedKey)
  ```
  signature of `getTranslations`. This update now fully supports the
  ```
  getTranslations(opts?: { locale: Locale, namespace: NestedKey })
  ```
  signature as well.
