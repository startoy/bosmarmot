const path = require('path')
const assert = require('assert')
const fs = require('fs-extra')
const monax = require('../../index')

const burrowURL = 'http://localhost:1339/rpc'
const accountPath = './account.json'
const contractPath = './GetSet.bin'
const contractABI = './GetSet.abi'

const account = fs.readJSONSync(path.join(__dirname, accountPath))
const binary = fs.readFileSync(path.join(__dirname, contractPath))
const ABI = fs.readJSONSync(path.join(__dirname, contractABI))

const testUint = 42
const testBytes = 'DEADBEEF00000000000000000000000000000000000000000000000000000000'
const testString = 'Hello World!'
const testBool = true

const contractManager = monax.newContractManagerDev(burrowURL, account)

// Create a factory for the contract with the JSON interface 'myAbi'.
const ContractFactory = contractManager.newContractFactory(ABI)

describe('Contract Deployment', function () {
  it('Should deploy a contract', function (done) {
    ContractFactory.new({data: binary}, function (error, contract) {
      if (error) {
        return done(error)
      }
      return done()
    })
  })
})

describe('Setting and Getting Values:', function () {
  let TestContract
  before(done =>
    // To create a new instance and simultaneously deploy a contract use `new`:
    ContractFactory.new({data: binary}, function (error, contract) {
      if (error) {
        return done(error)
      }
      TestContract = contract
      return done()
    })
  )

  it('Uint', function (done) {
    TestContract.setUint(testUint, function (err) {
      if (err) { return done(err) }

      TestContract.getUint(function (err, output) {
        if (err) { return done(err) }

        assert.equal(output, testUint)
        return done()
      })
    })
  })

  it('Bool', function (done) {
    TestContract.setBool(testBool, function (err) {
      if (err) { return done(err) }

      TestContract.getBool(function (err, output) {
        if (err) { return done(err) }

        assert.equal(output, testBool)
        return done()
      })
    })
  })

  it('Bytes', function (done) {
    TestContract.setBytes(testBytes, function (err) {
      if (err) { return done(err) }

      TestContract.getBytes(function (err, output) {
        if (err) { return done(err) }

        assert.equal(output, testBytes)
        return done()
      })
    })
  })

  it('String', function (done) {
    TestContract.setString(testString, function (err) {
      if (err) { return done(err) }

      TestContract.getString(function (err, output) {
        if (err) { return done(err) }

        assert.equal(output, testString)
        return done()
      })
    })
  })
})
