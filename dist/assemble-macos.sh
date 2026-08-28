#!/bin/sh
set -eu
cd "$(dirname "$0")"

arch="${1:-$(uname -m)}"
case "$arch" in
  arm64|aarch64)
    flavor="arm64"
    expected="8fd4ed4274b3ae3690a567a62315639f615ce8ec262e040ea90747f18a143dbc"
    ;;
  x64|x86_64|amd64)
    flavor="x64"
    expected="99ea573358d225dfabca84f251de5884810ad3d9a17b750599806ecf6b2a53d8"
    ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

archive="Aoyin-Desktop-Pet-0.1.0-mac-$flavor.tar.xz"
cat "$archive".*.part > "$archive"
actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
if [ "$actual" != "$expected" ]; then
  echo "Checksum mismatch: $actual" >&2
  exit 1
fi
tar -xJf "$archive"
echo "Created and verified: $archive"
echo "Extracted: Aoyin Desktop Pet.app"
