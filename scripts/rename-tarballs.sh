#!/usr/bin/env bash
# scripts/rename-tarballs.sh
# Renames oclif-pack outputs to stable filenames + writes SHA256SUMS.
set -euo pipefail

SRC_DIR="${1:-dist}"
DST_DIR="${2:-dist/release}"

mkdir -p "$DST_DIR"
rm -f "$DST_DIR"/* 2>/dev/null || true

shopt -s nullglob
matched=0
for f in "$SRC_DIR"/pega-v*-*.tar.gz "$SRC_DIR"/pega-v*-*.zip; do
  base=$(basename "$f")
  # Match: pega-v<version>-<sha>-<platform>-<arch>.<ext>  →  pega-<platform>-<arch>.<ext>
  if [[ "$base" =~ ^pega-v[^-]+-[^-]+-(darwin|linux|win32)-(x64|arm64)\.(tar\.gz|zip)$ ]]; then
    stable="pega-${BASH_REMATCH[1]}-${BASH_REMATCH[2]}.${BASH_REMATCH[3]}"
    cp "$f" "$DST_DIR/$stable"
    matched=$((matched + 1))
  fi
done

if [ "$matched" -eq 0 ]; then
  echo "ERROR: no matching tarballs found under $SRC_DIR" >&2
  exit 1
fi

cd "$DST_DIR"
sha256sum pega-* > SHA256SUMS
echo "Renamed $matched artefacts → $DST_DIR/"
ls -la
