#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
SOURCE="build/小小奇遇.app"
DEST="$HOME/Applications/小小奇遇.app"
AGENT="$HOME/Library/LaunchAgents/local.littlewonders.desktop.plist"
if [ ! -x "$SOURCE/Contents/MacOS/LittleWonders" ]; then bash scripts/build.sh; fi
mkdir -p "$HOME/Applications" "$HOME/Library/LaunchAgents"
if [ -e "$DEST" ] && [ "$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$DEST/Contents/Info.plist")" != "local.littlewonders.desktop" ]; then
  echo "目标位置已有其他应用，未覆盖。"; exit 1
fi
launchctl bootout "gui/$(id -u)/local.littlewonders.desktop" 2>/dev/null || true
python3 - "$DEST" "$(pwd)/$SOURCE" <<'PY'
import sys,subprocess,os,signal,time,pathlib,shutil,datetime
executables={p+'/Contents/MacOS/LittleWonders' for p in sys.argv[1:]}
for line in subprocess.check_output(['ps','-axo','pid=,command='],text=True,env={**os.environ,'LC_ALL':'en_US.UTF-8'}).splitlines():
 parts=line.strip().split(None,1)
 if len(parts)==2 and parts[1] in executables:
  try: os.kill(int(parts[0]),signal.SIGTERM)
  except ProcessLookupError: pass
time.sleep(.3)
state=pathlib.Path.home()/'Library/Application Support/LittleWonders/state.json'
if state.exists(): shutil.copy2(state,state.with_name('state-before-upgrade-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.json'))
PY
rm -rf "$DEST"
ditto "$SOURCE" "$DEST"
python3 - "$DEST" "$AGENT" <<'PY'
import os,sys,plistlib
app,agent=sys.argv[1:]
data={'Label':'local.littlewonders.desktop','ProgramArguments':[app+'/Contents/MacOS/LittleWonders'],'RunAtLoad':True,'ProcessType':'Interactive'}
with open(agent,'wb') as f: plistlib.dump(data,f)
shortcut=os.path.expanduser('~/Desktop/小小奇遇.app')
if not os.path.lexists(shortcut): os.symlink(app,shortcut)
PY
plutil -lint "$AGENT"
launchctl bootstrap "gui/$(id -u)" "$AGENT"
echo "已安装到 $DEST；已设置随登录打开。"
