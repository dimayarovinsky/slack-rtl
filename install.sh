#!/bin/bash
# Slack RTL (Hebrew) — installer for macOS.
# Copies files to ~/.slack-rtl, adds a `slack-rtl` shell alias, and creates
# a double-clickable "Slack RTL" app in ~/Applications.
set -eu

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.slack-rtl"

echo "Installing to $DEST ..."
mkdir -p "$DEST"
cp "$SRC_DIR/rtl.js" "$SRC_DIR/inject.py" "$SRC_DIR/slack-rtl" "$DEST/"
chmod +x "$DEST/slack-rtl"

# Shell alias (zsh is the macOS default)
if ! grep -qs 'slack-rtl' "$HOME/.zshrc"; then
  echo 'alias slack-rtl="$HOME/.slack-rtl/slack-rtl"' >> "$HOME/.zshrc"
  echo "Added 'slack-rtl' alias to ~/.zshrc"
fi

# Double-clickable app for non-terminal folks
mkdir -p "$HOME/Applications"
APP="$HOME/Applications/Slack RTL.app"
rm -rf "$APP"
osacompile -o "$APP" -e 'do shell script "$HOME/.slack-rtl/slack-rtl >/dev/null 2>&1 &"' >/dev/null
echo "Created '$APP' — you can drag it to the Dock."

echo ""
echo "Done! Start Slack with:  slack-rtl   (new terminal), or open 'Slack RTL' from ~/Applications."
echo "Launching it via the regular Slack icon will NOT apply RTL — use the launcher."
