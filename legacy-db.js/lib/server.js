'use strict'

const I = require('iteray')
const jsonRpc = require('@nodeguy/json-rpc')
const R = require('ramda')
const {is} = require('@nodeguy/type')
const util = require('util')

// Work around Burrow bug: https://github.com/hyperledger/burrow/issues/271
const convertIdToString = (request) =>
  R.assoc('id', String(request.id), request)

const addBurrowNamespace = (request) =>
  R.assoc('method', 'burrow.' + request.method, request)

// Burrow wants named parameters, sigh.
const positionToNamedParameters = (request) =>
  R.assoc('params', request.params[0], request)

// Work around Burrow bug: https://github.com/hyperledger/burrow/issues/270
const removeNullError = (response) =>
  response.error === null
    ? R.dissoc('error', response)
    : response

const transportWrapper = (transport) =>
  R.pipe(
    I.map(R.pipe(
      convertIdToString,
      addBurrowNamespace,
      positionToNamedParameters
    )),
    transport,
    I.map(removeNullError)
  )

module.exports = (transport) => {
  const {methods} = jsonRpc.client(transportWrapper(transport))

  // Our API expects callbacks instead of promises so wrap the methods.
  return new Proxy(methods, {get: (target, name) =>
    (...originalArgs) => {
      const lastArgument = originalArgs.slice(-1)[0]
      const callbackPassed = is(Function, lastArgument)
      const args = callbackPassed ? originalArgs.slice(0, -1) : originalArgs
      const callback = callbackPassed ? lastArgument : R.identity

      target[name](...args).then(
        (value) => callback(null, value),
        (reason) => {
          const {message, method, params} = reason

          console.error(`Burrow error:  Call of method "${method}" with ` +
            `parameters ${util.inspect(params[0])} responded with ` +
            `"${message}".`)

          callback(reason)
        }
      )
    }
  })
}
