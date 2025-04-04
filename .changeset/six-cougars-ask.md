---
"intl-watcher": patch
---

Improve diagnostic for dynamic namespace usage.

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