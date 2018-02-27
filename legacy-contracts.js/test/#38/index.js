'use strict'

const Promise = require('bluebird')
const Solidity = require('solc')
const test = require('../../lib/test')

const vector = test.Vector()

describe('#38', function () {
  before(vector.before(__dirname, {protocol: 'http:'}))
  after(vector.after())

  this.timeout(10 * 1000)

  it('#38', vector.it(function (manager) {
    const source = `
      contract Contract {
          event Event();

          function emit() {
              Event();
          }
      }
    `

    return test.compile(manager, source, 'Contract').then((contract) => {
      const compiled = Solidity.compile(source, 1).contracts.Contract
      const abi = JSON.parse(compiled.interface)
      const contractFactory = manager.newContractFactory(abi)

      return Promise.fromCallback((callback) =>
        contractFactory.at(contract.address, callback)
      ).then((secondContract) =>
        new Promise((resolve, reject) => {
          secondContract.Event.once((error, event) => {
            if (error) {
              reject(error)
            } else {
              resolve(event)
            }
          })

          contract.emit()
        })
      )
    })
  }))
})
