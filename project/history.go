package project

import (
	"github.com/monax/relic"
)

// The releases described by version string and changes, newest release first.
// The current release is taken to be the first release in the slice, and its
// version determines the single authoritative version for the next release.
//
// To cut a new release add a release to the front of this slice then run the
// release tagging script: ./scripts/tag_release.sh
var History relic.ImmutableHistory = relic.NewHistory("Bosmarmot").MustDeclareReleases(
	"0.0.1",
	`Initial Bosmarmot combining and refactoring Monax tooling, including:
- The monax tool (just 'monax pkgs do')
- The monax-keys signing daemon
- Monax compilers
- A basic legacy-contracts.js integration test (merging in JS libs is pending)

`,
)
