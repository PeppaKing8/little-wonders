#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
APP="build/小小奇遇.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
xcrun clang -isysroot /Library/Developer/CommandLineTools/SDKs/MacOSX14.5.sdk -mmacosx-version-min=13.0 -fobjc-arc -O2 -framework Cocoa -framework WebKit Sources/App.m -o "$APP/Contents/MacOS/LittleWonders"
cp Resources/* "$APP/Contents/Resources/"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>小小奇遇</string>
<key>CFBundleDisplayName</key><string>小小奇遇</string>
<key>CFBundleIdentifier</key><string>local.littlewonders.desktop</string>
<key>CFBundleVersion</key><string>3</string>
<key>CFBundleShortVersionString</key><string>1.2</string>
<key>CFBundleExecutable</key><string>LittleWonders</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>LSUIElement</key><true/>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
/usr/bin/codesign --force --deep --sign - "$APP"
echo "Built: $APP"
