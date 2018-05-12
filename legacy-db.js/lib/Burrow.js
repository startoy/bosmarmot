/**
 * @file Burrow.js
 * @fileOverview Factory module for the Burrow class.
 * @author Andreas Olofsson
 * @module Burrow
 */

'use strict'

var accountsF = require('./accounts')
var blockChainF = require('./blockchain')
var consensusF = require('./consensus')
var eventsF = require('./events')
var nameregF = require('./namereg')
var networkF = require('./network')
var transactionsF = require('./transactions')

/**
 * Create a new instance of the Burrow class.
 *
 * @param {module:rpc/client-Client} client - The networking client object.
 * @param {module:validation~Validator} validator - The validator object.
 * @returns {Burrow} - A new instance of the Burrow class.
 */
exports.createInstance = function (server) {
  return new Burrow(server)
}

/**
 * The main class.
 *
 * @param {module:rpc/client-Client} client - The networking client object.
 * @param {module:validation~Validator} validator - The validator object.
 * @constructor
 */
function Burrow (server) {
  this.server = server
  var events = eventsF.createInstance(server)

  var accounts = accountsF.createInstance(server)
  var blockChain = blockChainF.createInstance(server)
  var consensus = consensusF.createInstance(server)
  var namereg = nameregF.createInstance(server, events)
  var network = networkF.createInstance(server)
  var transactions = transactionsF.createInstance(server)

  this._accounts = accounts
  this._blockChain = blockChain
  this._consensus = consensus
  this._events = events
  this._namereg = namereg
  this._network = network
  this._transactions = transactions
}

/**
 * Get the <tt>Accounts</tt> object.
 *
 * @returns {module:accounts~Accounts}
 */
Burrow.prototype.accounts = function () {
  return this._accounts
}

/**
 * Get the <tt>BlockChain</tt> object.
 *
 * @returns {module:blockchain~BlockChain}
 */
Burrow.prototype.blockchain = function () {
  return this._blockChain
}

/**
 * Get the <tt>Consensus</tt> object.
 *
 * @returns {module:consensus~Consensus}
 */
Burrow.prototype.consensus = function () {
  return this._consensus
}

/**
 * Get the <tt>Events</tt> object.
 *
 * @returns {module:events~Events}
 */
Burrow.prototype.events = function () {
  return this._events
}

/**
 * Get the <tt>NameReg</tt> object.
 *
 * @returns {module:namereg~NameReg}
 */
Burrow.prototype.namereg = function () {
  return this._namereg
}

/**
 * Get the <tt>Network</tt> object.
 *
 * @returns {module:network~Network}
 */
Burrow.prototype.network = function () {
  return this._network
}

/**
 * Get the <tt>Transactions</tt> object.
 *
 * @returns {module:transactions~Transactions}
 */
Burrow.prototype.txs = function () {
  return this._transactions
}
