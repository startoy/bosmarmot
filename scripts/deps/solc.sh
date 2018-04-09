#!/usr/bin/env bash
set -e
# The version of solc we will fetch and install into ./bin/ for integration testsS
# Our custom build of solidity fixing linking issue; https://github.com/monax/solidity/tree/contract-name-not-path
SOLC_URL="https://drive.google.com/uc?export=download&id=1c22-bk4KsCLbLp4P5uz1CbH8_Y2Ho0l6"
SOLC_BIN="$1"

wget -O "$SOLC_BIN" "$SOLC_URL"

chmod +x "$SOLC_BIN"
