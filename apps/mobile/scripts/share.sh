#!/usr/bin/env bash
# Publish the current JS to the `main` channel and print the links people need.
#
#   npm run share -- "what changed"
#
# Requires: `eas login` once, EAS_OWNER + EAS_PROJECT_ID set (see .env.example), and a development
# build of this app installed on the recipient's phone (`eas build --profile development`). Expo Go
# on a phone also works, but only when that phone's Expo Go is signed into the owning account or org.
set -euo pipefail
cd "$(dirname "$0")/.."

MESSAGE="${1:-update}"
CONFIG=$(npx expo config --type public --json 2>/dev/null)
read -r OWNER SLUG PROJECT_ID < <(node -e '
  const c = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.log(c.owner ?? "", c.slug, c.extra?.eas?.projectId ?? "");
' <<<"$CONFIG")

if [[ -z "$PROJECT_ID" || -z "$OWNER" ]]; then
  echo "No EAS project configured. Run \`npm run setup -- --eas-init\`: it links one and sets EAS_OWNER and EAS_PROJECT_ID in .env.local." >&2
  exit 1
fi

eas update --channel main --message "$MESSAGE" --environment production --non-interactive

cat <<LINKS

Channel link (always the newest publish):
  exp://u.expo.dev/${PROJECT_ID}?channel-name=main

Dashboard:
  https://expo.dev/accounts/${OWNER}/projects/${SLUG}/updates
LINKS
