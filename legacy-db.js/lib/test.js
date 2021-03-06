'use strict'

const deterministic = require('./deterministic')
const Burrow = require('..')
const fs = require('mz/fs')
const I = require('iteray')
const jsonRpc = require('@nodeguy/json-rpc')
const path = require('path')
const Promise = require('bluebird')
const testVector = require('test-vector')
const url = require('url')

const blockchainUrl = ({protocol = 'ws:', port = '1339', host = 'localhost'}) => {
  return url.format({
    protocol,
    slashes: true,
    hostname: 'localhost',
    port: port,
    pathname: protocol === 'ws:' ? '/socketrpc' : '/rpc'
  })
}

const vectorFileName = () => {
  if (process.env.vector) {
    return process.env.vector + '.json'
  } else {
    return 'vector.json'
  }
}

// Base 'class' for different Vector behaviors below.
const Vector = () => ({
  after: () =>
    function () {
    }
})

// Run the tests while recording the conversation with the server.
const VectorRecord = () => {
  let db
  let dir
  let transport
  let vector
  const vectors = {it: {}}

  const run = (callback, thisArg, save) =>
    Promise.try(callback.bind(
      thisArg,
      {db, account: vectors.account}
    )).finally(() => {
      vector.push(Promise.resolve({done: true}))
      return I.to(Array, vector).then(save)
    })

  return Object.assign(Vector(), {
    before: (newDir, options, callback) =>
      function () {
        this.timeout(60 * 1000)
        dir = newDir

        const urlString = blockchainUrl(options)

        try {
          vectors.account = JSON.parse(process.env.account)
        } catch (err) {
          return Promise.reject(new Error('Could not parse required account JSON: ' + process.env.account + " Make sure you are passing a valid account json string as an env var account='{accountdata}'"))
        }

        transport = deterministic(jsonRpc.transport(url.parse(urlString)))
        const {memoized, vector: newVector} = testVector.memoize(transport)

        vector = newVector
        db = Burrow.createInstance(memoized)

        if (callback) {
          const save = (vectorArray) => {
            vectors.before = vectorArray
          }

          return run(callback, this, save)
        }
      },

    after: () =>
      function () {
        return Promise.all([
          fs.writeFile(
            path.join(dir, vectorFileName()),
            JSON.stringify(vectors, null, 2)
          )
        ])
      },

    it: (callback) =>
      function () {
        const save = (vectorArray) => {
          vectors.it[this.test.title] = vectorArray
        }

        return run(callback, this, save)
      }
  })
}

// Run the tests against the previously recorded server converstion.
const VectorPlay = () => {
  let db
  let mockStatus
  const vector = I.AsyncQueue()
  let vectors

  const run = (recording, callback, thisArg) =>
    new Promise((resolve, reject) => {
      mockStatus.catch(reject)

      recording.forEach((value) => {
        vector.push(Promise.resolve({done: false, value}))
      })

      return Promise.try(() =>
        callback.call(
          thisArg,
          {db, account: vectors.account}
        )
      ).then(resolve, reject)
    })

  return Object.assign(Vector(), {
    before: (dir, options, callback) =>
      function () {
        vectors = require(path.join(dir, vectorFileName()))
        const {mock, status} = testVector.mockFunction(vector)
        mockStatus = status
        db = Burrow.createInstance(mock)

        if (callback) {
          return run(vectors.before, callback, this)
        }
      },

    it: (callback) =>
      function () {
        return run(vectors.it[this.test.title], callback, this)
      }
  })
}

// Test the server against the previously recorded client conversation.
const VectorServer = () => {
  let dir
  let transport
  let vectors

  const run = (vector) =>
    testVector.mockCaller(
      I.to('AsyncIterable', vector.concat(
        {input: {done: true}},
        {output: {done: true}}
      )),
      transport
    )

  return Object.assign(Vector(), {
    before: (newDir, options) =>
      function () {
        this.timeout(60 * 1000)
        dir = newDir
        vectors = require(path.join(dir, vectorFileName()))

        const urlString = blockchainUrl(options)

        return Promise.resolve()
          .then(() => {
            transport = deterministic(jsonRpc.transport(url.parse(urlString)))

            if (vectors.before) {
              return run(vectors.before)
            }
          })
      },

    after: () =>
      function () {
        return Promise.resolve()
      },

    it: () =>
      function () {
        return run(vectors.it[this.test.title])
      }
  })
}

module.exports = {
  Vector: process.env.TEST === 'record'
    ? VectorRecord
    : process.env.TEST === 'server'
      ? VectorServer
      : VectorPlay
}
