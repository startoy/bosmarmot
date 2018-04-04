#!/usr/bin/env bash
set -e
# The version of solc we will fetch and install into ./bin/ for integration testsS
# solc 0.4.4 - work around for compilers tests not working with 0.4.20 (EPM does)
SOLC_URL="https://drive.google.com/uc?export=download&id=1ysiFE541bpNCbvwcijULKoa2zoVEMGIl"
SOLC_BIN="$1"

wget -O "$SOLC_BIN" "$SOLC_URL"

chmod +x "$SOLC_BIN"
