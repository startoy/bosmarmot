/**
 * @file index.js
 * @fileOverview Index file for the Burrow javascript API. This file contains a factory method
 * for creating a new <tt>Burrow</tt> instance.
 * @author Andreas Olofsson
 * @module index
 */
'use strict'

var Burrow = require('./lib/Burrow')
const generic = require('@nodeguy/generic')
const I = require('iteray')
const is = require('@nodeguy/type').is
const jsonRpc = require('@nodeguy/json-rpc')
const R = require('ramda')
const server = require('./lib/server')
const util = require('util')
var validation = require('./lib/validation')
var url = require('url')

const createInstance = generic.function()

const inspect = (object) =>
  util.inspect(object, {depth: null, colors: true})

const debuglog = R.compose(util.debuglog('monax'), inspect)

createInstance.method([is(Function)],
  (transport) => {
    const logged = R.pipe(
      I.forEach(debuglog),
      transport,
      I.forEach(debuglog)
    )

    var validator = new validation.SinglePolicyValidator(true)
    return Burrow.createInstance(server(logged), validator)
  }
)

/**
 * Burrow allows you to do remote calls to a running Burrow-tendermint client.
 *
 * @param {string} URL The RPC endpoint URL.
 * @returns {module:Burrow-Burrow}
 */
createInstance.method([is(String)],
  (urlString) => {
    const parsed = url.parse(urlString)

    if (parsed.protocol === 'ws:') {
      throw new Error('WebSocket is disabled until Burrow complies with ' +
        'JSON-RPC.  See: https://github.com/hyperledger/burrow/issues/355')
    } else {
      return createInstance(jsonRpc.transport(parsed))
    }
  }
)

module.exports = {
  createInstance
}
