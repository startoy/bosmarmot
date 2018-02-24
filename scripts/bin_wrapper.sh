#!/usr/bin/env bash

# Use keys, burrow, solc binaries in the repo's bin directory
export PATH=$(readlink -f bin):$PATH

"$@"