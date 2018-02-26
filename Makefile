#
# |_  _  _ _ _  _  _ _ _  _ _|_
# |_)(_)_\| | |(_|| | | |(_) |
#
# Bosmarmot Makefile
#
# Requires go version 1.8 or later.
#

SHELL := /bin/bash
REPO := $(shell pwd)
GO_FILES := $(shell go list -f "{{.Dir}}" ./...)
GOPACKAGES_NOVENDOR := $(shell go list ./...)

### Integration test binaries
# We make the relevant targets for building/fetching these depend on the Makefile itself - if unnecessary rebuilds
# when changing the Makefile become a problem we can move these values into individual files elsewhere and make those
# files specific targets for their respective binaries

### Tests and checks
# Run goimports (also checks formatting) first display output first, then check for success
.PHONY: check
check:
	@go get golang.org/x/tools/cmd/goimports
	@goimports -l -d ${GO_FILES}
	@goimports -l ${GO_FILES} | read && echo && \
	echo "Your marmot has found a problem with the formatting style of the code."\
	 1>&2 && exit 1 || true

# Just fix it
.PHONY: fix
fix:
	@goimports -l -w ${GO_FILES}

# Run testsGOFILES_NOVENDOR
.PHONY:	test
test: check bin/solc
	@scripts/bin_wrapper.sh go test ${GOPACKAGES_NOVENDOR}

# Run tests for development (noisy)
.PHONY:	test_dev
test_dev:
	@go test -v ${GOPACKAGES_NOVENDOR}

# Run tests including integration tests
.PHONY:	test_integration
test_integration: build_bin bin/solc bin/burrow
	@scripts/bin_wrapper.sh monax/tests/test_jobs.sh

# Use a provided/local Burrow
.PHONY:	test_integration_no_burrow
test_integration_no_burrow: build_bin bin/solc
	@scripts/bin_wrapper.sh monax/tests/test_jobs.sh

### Vendoring

# erase vendor wipes the full vendor directory
.PHONY: erase_vendor
erase_vendor:
	rm -rf ${REPO}/vendor/

# install vendor uses dep to install vendored dependencies
.PHONY: reinstall_vendor
reinstall_vendor: erase_vendor
	@go get -u github.com/golang/dep/cmd/dep
	@dep ensure -v

# delete the vendor directy and pull back using dep lock and constraints file
# will exit with an error if the working directory is not clean (any missing files or new
# untracked ones)
.PHONY: ensure_vendor
ensure_vendor: reinstall_vendor
	@scripts/is_checkout_dirty.sh

### Builds

.PHONY: build_bin
build_bin:
	@go build -o bin/bos ./monax/cmd/bos
	@go build -o bin/monax-keys ./keys/cmd/monax-keys

bin/solc: ./scripts/deps/solc.sh
	@mkdir -p bin
	@scripts/deps/solc.sh bin/solc
	@touch bin/solc


bin/burrow: ./scripts/deps/burrow.sh
	@GOPATH="${REPO}/.gopath_burrow" \
	scripts/go_build_revision.sh \
	https://github.com/hyperledger/burrow.git \
	github.com/hyperledger/burrow \
	$(shell ./scripts/deps/burrow.sh) \
	cmd/burrow \
	bin/burrow

# Build all the things
.PHONY: build
build:	build_bin

# Build binaries for all architectures
.PHONY: build_dist
build_dist:
	@goreleaser --rm-dist --skip-publish --skip-validate

# Do all available tests and checks then build
.PHONY: build_ci
build_ci: check test build

### Release and versioning

# Print version
.PHONY: version
version:
	@go run ./project/cmd/version/main.go

# Generate full changelog of all release notes
CHANGELOG.md: ./project/history.go ./project/cmd/changelog/main.go
	@go run ./project/cmd/changelog/main.go > CHANGELOG.md

# Generated release notes for this version
NOTES.md:  ./project/history.go ./project/cmd/notes/main.go
	@go run ./project/cmd/notes/main.go > NOTES.md

# Tag the current HEAD commit with the current release defined in
# ./release/release.go
.PHONY: tag_release
tag_release: test check CHANGELOG.md build_bin
	@scripts/tag_release.sh

# If the checked out commit is tagged with a version then release to github
.PHONY: release
release: NOTES.md
	@scripts/release.sh
