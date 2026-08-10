# Public DNS policy feed

This directory is intentionally public and data-only. It exists so AdGuard Home can fetch a custom DNS rule list over ordinary HTTPS without GitHub credentials.

Canonical feed after merge:

```text
https://raw.githubusercontent.com/KAFKA2306/readable-github/main/dns/kafka-filter.txt
```

The file contains only custom override rules. Broad filtering remains delegated to the official AdGuard DNS filter. Do not commit credentials, private DNS endpoint names, device identifiers, query logs, certificates, keys, or runtime configuration here.

DNS filtering cannot remove same-origin page elements by CSS/DOM selector; it only blocks DNS names. The feed therefore stays conservative to avoid breaking logins, payments, and other first-party functions.
