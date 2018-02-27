// This test fails because of a Burrow bug:
// https://github.com/hyperledger/burrow/issues/300

'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../../lib/test')

const source = `
  contract twentyseven {
    function getString2() constant returns (string){
        string memory abcde = new string(3);
        return "a";
    }
  }
`

it('tests legacy-db.js issue #27', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain').then((manager) =>
    test.compile(manager, source, 'twentyseven').then((contract) =>
      Promise.fromCallback((callback) => contract.getString2(callback))
        .then((result) => {
          assert.equal(result, 'a')
        })
    )
  )
})
