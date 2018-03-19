'use strict'

const childProcess = require('mz/child_process')
const deterministic = require('./deterministic')
const Burrow = require('..')
const fs = require('mz/fs')
const G = require('g-functions')
const httpRequest = require('request-promise')
const I = require('iteray')
const jsonRpc = require('@nodeguy/json-rpc')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const R = require('ramda')
const testVector = require('test-vector')
const url = require('url')
const WebSocket = require('ws')

const exec = R.composeP(G.trim, R.head, childProcess.exec)

const intervalAsyncIterable = (delay) => {
  let lastOutput = Date.now()

  return I.AsyncQueue((push) =>
    setTimeout(() => {
      lastOutput = Date.now()

      push(Promise.resolve({
        done: false,
        value: lastOutput
      }))
    }, delay - (Date.now() - lastOutput))
  )
}

const poll = R.curry((action, interval) => {
  const asyncIterator = I.to('Iterator', R.pipe(
    I.map(() => Promise.try(action)),
    I.pull
  )(interval))

  const next = () =>
    asyncIterator.next().catch(next)

  return next().then(R.prop('value'))
})


const blockchainUrl = (protocol) => {
  return url.format({
      protocol: protocol,
      slashes: true,
      hostname: 'localhost',
      port: '1337',
      pathname: protocol === 'ws:' ? '/socketrpc' : '/rpc'
    })
}

const webSocketIsAvailable = (url) =>
  poll(() =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url)

      socket.once('open', () => {
        socket.close()
        resolve()
      })

      socket.once('error', reject)
    }),
    intervalAsyncIterable(100)
  ).then(() => url)

const httpIsAvailable = (url) =>
  poll(() => httpRequest(url).catch((reason) => {
    if (reason.name === 'RequestError') {
      throw reason
    }
  }), intervalAsyncIterable(100)
  ).then(R.always(url))


const startBlockchain = (chainDir, {protocol = 'ws:'} = {}) => {

    const genesisFile = path.join(chainDir, 'genesis.json')
    const configFile  = path.join(chainDir, 'config.toml')

    return exec(`burrow -c ${configFile} -g ${genesisFile}`)
        .then(() => {
          const url = blockchainUrl(protocol, name)
          console.log(`Started blockchain at ${url}.`)
          return url
        })
        .then(protocol === 'ws:' ? webSocketIsAvailable : httpIsAvailable)
  }

const stopBlockchain = (chainDir) => {
  return exec('kill $(pgrep burrow)')
    .then(rmBlockchain(chainDir))
}

const rmBlockchain = (chainDir) => {
  burrowDir = path.join(chainDir, '.burrow')
  return exec(`rm -rf $(burrowDir`)
    .then(() => {
      console.log(`Removed blockchain.`)
    })
}

const startKeys = (chainDir) => {
  keysDir = path.join(chainDir, 'keys')
  return exec(`monax-keys -p 48002 --dir $(chainDir)`)
}

const stopKeys = () => {
  return exec('kill $(pgrep monax-keys)')
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
  let chainDir
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
    before: (newDir, newChainDir, options, callback) =>
      function () {
        this.timeout(60 * 1000)
        chainDir = newChainDir
        dir = newDir

        return startKeys(chainDir)
          .then(() => {return startBlockchain(chainDir, options)})
          .then((urlString) => {

            vectors.account = Object.assign({}, require(path.join(chainDir, 'account.json')))

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
          })
      },

    after: () =>
      function () {
        return Promise.all([
          fs.writeFile(
            path.join(dir, 'vector.json'),
            JSON.stringify(vectors, null, 2)
          ),

          stopBlockchain(chainDir),
          stopKeys()
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
        vectors = require(path.join(dir, 'vector.json'))
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
  let chainDir
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
    before: (newDir, newChainDir, options) =>
      function () {
        this.timeout(60 * 1000)
        chainDir = newChainDir
        dir = newDir
        vectors = require(path.join(dir, 'vector.json'))

        return startBlockchain(chainDir,
          Object.assign({}, options)
        ).then((urlString) => {
          transport = deterministic(jsonRpc.transport(url.parse(urlString)))

          if (vectors.before) {
            return run(vectors.before)
          }
        })
      },

    after: () =>
      function () {
        return stopBlockchain(chainDir)
          .then(stopKeys())
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
