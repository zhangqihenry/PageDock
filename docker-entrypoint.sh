#!/bin/sh
set -eu

# Bind-mounted Synology folders commonly use a host UID that differs from the
# image's `node` user. Repair the complete data tree so restored or manually
# copied files remain manageable after an image update.
mkdir -p /data/sites /data/tool-data /data/work/uploads /data/work/staging

if ! chown -R node:node /data; then
  echo "PageDock cannot set ownership on /data. Check the Synology bind-mount permissions." >&2
  exit 1
fi

if ! chmod -R u+rwX /data; then
  echo "PageDock cannot set read/write permissions on /data. Check the Synology ACL settings." >&2
  exit 1
fi

# Do a real write/delete probe as the final runtime user. This catches DSM ACL
# rules that can still deny access even when Unix ownership looks correct.
if ! su-exec node sh -c '
  probe="/data/.pagedock-write-check-$$"
  mkdir "$probe" &&
  : > "$probe/file" &&
  rm -rf "$probe"
'; then
  echo "PageDock data permission check failed." >&2
  echo "In File Station, grant read/write permission on the pagedock/data folder and apply it to child items." >&2
  exit 1
fi

umask 0027
exec su-exec node "$@"
