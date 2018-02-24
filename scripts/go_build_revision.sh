#!/usr/bin/env bash
# Gives us a non-zero exit code if there are tracked or untracked changes in the working
# directory
REPO=$1
PROJECT=$2
REVISION=$3
PACKAGE=$4
OUTPUT=$5

PROJECT_PATH="${GOPATH}/src/${PROJECT}"

$(cd "$PROJECT_PATH" > /dev/null) || git clone ${REPO} ${PROJECT_PATH}
pushd "$PROJECT_PATH"
git fetch --all
git checkout ${REVISION}
popd
go build -o ${OUTPUT} ${PROJECT}/${PACKAGE}