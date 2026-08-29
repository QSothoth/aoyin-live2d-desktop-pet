#!/bin/sh
set -eu
cd "$(dirname "$0")"

arch="${1:-$(uname -m)}"
case "$arch" in
  arm64|aarch64)
    flavor="arm64"
    expected="0cab7d21c2c6fe511067c96aa7732ac0ab308695b3af046f2aa817b32738e7f8"
    ;;
  x64|x86_64|amd64)
    flavor="x64"
    expected="2e7276845edd59d55c6ba34f8201abb42cd856f40953965b479667010695f1cc"
    ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

archive="Aoyin-Desktop-Pet-0.2.0-mac-$flavor.tar.xz"
cat "$archive".*.part > "$archive"
actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
if [ "$actual" != "$expected" ]; then
  echo "Checksum mismatch: $actual" >&2
  exit 1
fi
tar -xJf "$archive"
echo "Created and verified: $archive"
echo "Extracted: Aoyin Desktop Pet.app"
