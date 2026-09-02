# Slack RTL (Hebrew) for macOS

Slack's desktop app doesn't support right-to-left text. This adds it: Hebrew
messages render RTL, and the message box flips direction live while you type
Hebrew.

It works by launching Slack with a local debugging port and injecting a small
script (adapted from [gregvish/slackrtl](https://github.com/gregvish/slackrtl))
into Slack's window. Nothing in the Slack app itself is modified, so it
survives Slack updates.

## Install

Unzip, then in Terminal:

```
cd slack-rtl
./install.sh
```

No dependencies — uses the Mac's built-in `python3`.

## Use

Start Slack via the launcher instead of the regular Slack icon:

- Terminal: `slack-rtl` (open a new terminal window after install), or
- Double-click **Slack RTL** in `~/Applications` (drag it to your Dock).

If Slack is already running normally, the launcher restarts it with RTL
enabled. Running the launcher again while Slack is up just re-applies the fix
(harmless).

## Good to know

- This only changes rendering on **your** machine — people without it still
  see Hebrew left-to-right.
- If you open Slack from the regular icon, RTL won't be applied until you run
  the launcher again.
- The fix depends on Slack's internal CSS class names
  (`p-rich_text_section`, `ql-editor`). A Slack update could break it; if
  Hebrew stops flipping, ping whoever shared this with you.
- The debugging port (9222) is only reachable from your own machine
  (localhost), but note that any local process could connect to it while
  Slack runs this way.

## Uninstall

```
rm -rf ~/.slack-rtl "$HOME/Applications/Slack RTL.app"
```

Then remove the `slack-rtl` alias line from `~/.zshrc` and restart Slack
normally.
