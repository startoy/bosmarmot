package jobs

import (
	acm "github.com/hyperledger/burrow/account"
	"github.com/monax/bosmarmot/monax/definitions"
	"github.com/monax/bosmarmot/monax/keys"
	"github.com/monax/bosmarmot/monax/log"
	"github.com/monax/bosmarmot/monax/util"
)

func SetAccountJob(account *definitions.Account, do *definitions.Do) (string, error) {
	var result string
	var err error

	// Preprocess
	account.Address, _ = util.PreProcess(account.Address, do)

	// Set the Account in the Package & Announce
	do.Package.Account = account.Address
	log.WithField("=>", do.Package.Account).Info("Setting Account")

	address, err := acm.AddressFromHexString(account.Address)
	if err != nil {
		return "", err
	}
	// Set the public key from monax-keys
	keyClient, err := keys.InitKeyClient(do.Signer)
	if err != nil {
		return util.KeysErrorHandler(do, err)
	}
	publicKey, err := keyClient.PublicKey(address)
	if err != nil {
		return util.KeysErrorHandler(do, err)
	}

	do.PublicKey = publicKey.KeyString()

	// Set result and return
	result = account.Address
	return result, nil
}

func SetValJob(set *definitions.SetJob, do *definitions.Do) (string, error) {
	var result string
	set.Value, _ = util.PreProcess(set.Value, do)
	log.WithField("=>", set.Value).Info("Setting Variable")
	result = set.Value
	return result, nil
}
