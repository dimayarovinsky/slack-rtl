# Slack RTL (Hebrew) for macOS

The Slack desktop app does not support right-to-left text. This tool fixes
that: Hebrew messages show right-to-left, and the message box flips direction
while you type Hebrew.

How it works: instead of opening Slack the normal way, you open it through a
small launcher. The launcher starts Slack and adds a script (adapted from
[gregvish/slackrtl](https://github.com/gregvish/slackrtl)) that fixes the text
direction. It does not change the Slack app itself, so it keeps working after
Slack updates.

## Install

In Terminal:

```
git clone https://github.com/dimayarovinsky/slack-rtl.git
cd slack-rtl
./install.sh
```

That's it. No extra software needed, it uses the Mac's built-in `python3`.

## How to use

From now on, open Slack in one of these ways instead of the regular Slack
icon:

- Double-click **Slack RTL** in your `~/Applications` folder. You can drag it
  to your Dock and use it like the normal Slack icon.
- Or type `slack-rtl` in a Terminal window (open a new Terminal after
  installing).
- Or run the launcher script directly from this folder: `./slack-rtl`. This
  works even without running the installer, if you just want to try it first.

If Slack is already open, the launcher will restart it with the fix. Running
the launcher again while Slack is open is fine, it just applies the fix again.

## Good to know

- The fix only changes how Slack looks on your own screen. Teammates without
  it still see Hebrew left-to-right.
- If you open Slack from the regular icon, the fix is not applied. Just run
  the launcher and it will restart Slack correctly.
- A future Slack update might break the fix. If Hebrew stops showing
  right-to-left one day, open an issue on this repo.
- While Slack runs this way it keeps a local debugging port (9222) open. Only
  programs on your own computer can reach it, but it is worth knowing.

## Uninstall

```
rm -rf ~/.slack-rtl "$HOME/Applications/Slack RTL.app"
```

Then remove the `slack-rtl` line from `~/.zshrc` and open Slack the normal
way again.

## Credits and license

The idea and the original text-direction script come from
[gregvish/slackrtl](https://github.com/gregvish/slackrtl). This project is a
rewrite for the Slack desktop app.

MIT license, see [LICENSE](LICENSE).
