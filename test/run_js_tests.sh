#!/usr/bin/env bash
# ----------------------------------------------------------
# PURPOSE

# This is the test manager for monax jobs. It will run the testing
# sequence for monax jobs referencing test fixtures in this tests directory.

# ----------------------------------------------------------
# REQUIREMENTS

# m

# ----------------------------------------------------------
# USAGE

# test_jobs.sh [appXX]

# Various required binaries locations can be provided by wrapper
burrow_bin=${burrow_bin:-burrow}
keys_bin=${keys_bin:-monax-keys}

# If false we will not try to start keys or Burrow and expect them to be running
boot=${boot:-true}
debug=${debug:-false}

test_exit=0

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
chain_dir="${script_dir}/chain"
js_dir="${script_dir}/../legacy-contracts.js"

if [[ "$debug" = true ]]; then
    set -o xtrace
fi

# ----------------------------------------------------------
# Constants

# Ports etc must match those in burrow.toml
keys_port=48002
rpc_tm_port=48003
burrow_root="${script_dir}/.burrow"

# Temporary logs
keys_log=keys.log
burrow_log=burrow.log
#
# ----------------------------------------------------------

# ---------------------------------------------------------------------------
# Needed functionality

account_data(){
  test_account=$(jq -r "." ${chain_dir}/account.json)
}

test_setup(){
  echo "Setting up..."

  echo
  echo "Using binaries:"
  echo "  $(type ${keys_bin}) (version: $(${keys_bin} version))"
  echo "  $(type ${burrow_bin}) (version: $(${burrow_bin} --version))"
  echo
  # start test chain
  if [[ "$boot" = true ]]; then
    echo "Booting keys then Burrow.."
    echo "Starting keys on port $keys_port"
    ${keys_bin} server --port ${keys_port} --dir keys 2> "$keys_log" &
    keys_pid=$!

    sleep 1
    echo "Starting Burrow with tendermint port: $tendermint_port, tm RPC port: $rpc_tm_port"
    rm -rf ${burrow_root}
    ${burrow_bin} -c "${chain_dir}/burrow.toml" -g "${chain_dir}/genesis.json" 2> "$burrow_log" &
    burrow_pid=$!

    sleep 1

  else
    echo "Not booting Burrow or keys, but expecting Burrow to be running with tm RPC on port $rpc_tm_port and keys"\
        "to be running on port $keys_port"
  fi

  account_data
  sleep 4 # boot time

  echo "Setup complete"
  echo ""
}


perform_tests(){
  echo ""

  cd "$js_dir"

  account=$test_account mocha --recursive --reporter mocha-circleci-reporter

  test_exit=$?
}

test_teardown(){
  echo "Cleaning up..."
  if [[ "$boot" = true ]]; then
    kill ${burrow_pid}
    echo "Waiting for burrow to shutdown..."
    wait ${burrow_pid} 2> /dev/null &
    kill ${keys_pid}
    echo "Waiting for keys to shutdown..."
    wait ${keys_pid} 2> /dev/null &
    rm -rf "$burrow_root"
  fi
  echo ""
  if [[ "$test_exit" -eq 0 ]]
  then
    [[ "$boot" = true ]] && rm -f "$burrow_log" "$keys_log"
    echo "Tests complete! Tests are Green. :)"
  else
    echo "Tests complete. Tests are Red. :("
    echo "Failure in: $app"
  fi
  exit ${test_exit}
}

# ---------------------------------------------------------------------------
# Setup


echo "Hello! I'm the marmot that tests the $bos_bin jobs tooling."
echo
echo "testing with target $bos_bin"
echo
test_setup

# ---------------------------------------------------------------------------
# Go!

trap test_teardown EXIT

echo "Running js Tests..."
perform_tests

