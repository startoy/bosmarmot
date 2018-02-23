#!/usr/bin/env bash
# Gives us a non-zero exit code if there are tracked or untracked changes in the working
# directory
BURROW_COMMIT=$1
BURROW_REPO=github.com/hyperledger/burrow

go get -d ${BURROW_REPO}/cmd/burrow
pushd ${GOPATH}/src/${BURROW_REPO}
git checkout ${BURROW_COMMIT}
popd
go build -o bin/burrow ${BURROW_REPO}/cmd/burrow