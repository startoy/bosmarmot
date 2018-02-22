package commands

import (
	"fmt"

	keys2 "github.com/hyperledger/burrow/keys"
	"github.com/monax/bosmarmot/monax/keys"
	"github.com/monax/bosmarmot/monax/util"
	"github.com/spf13/cobra"
)

var Keys = &cobra.Command{
	Use:   "keys",
	Short: "do specific tasks with keys",
	Long: `the keys subcommand is an opiniated wrapper around
[monax-keys] and requires a keys container to be running

It is for development only. Advanced functionality is available via
the [monax services exec keys "monax-keys CMD"] command.`,
	Run: func(cmd *cobra.Command, args []string) { cmd.Help() },
}

var keysGen = &cobra.Command{
	Use:   "gen",
	Short: "generates an unsafe key in the keys container",
	Long: `generates an unsafe key in the keys container

Key is created in keys data container and can be exported to host
by using the [--save] flag or by running [monax keys export ADDR].`,
	Run: GenerateKey,
}

var keysList = &cobra.Command{
	Use:   "ls",
	Short: "list keys on host",
	Long:  `list keys on host`,
	Run:   ListKeys,
}

var healthCheck = &cobra.Command{
	Use:   "alive",
	Short: "returns 0 if there is a live keys host running 1 if it does not",
	Long:  ``,
	Run:   HealthCheck,
}

func buildKeysCommand() {
	Keys.AddCommand(keysGen)
	Keys.AddCommand(keysList)
	Keys.AddCommand(healthCheck)
}

func GenerateKey(cmd *cobra.Command, args []string) {
	util.IfExit(ArgCheck(0, "eq", cmd, args))
	keyClient, err := keys.InitKeyClient(do.Signer)
	util.IfExit(err)
	address, err := keyClient.Generate("", keys2.KeyTypeEd25519Ripemd160)
	util.IfExit(err)
	fmt.Println(address.String())
}

func ListKeys(cmd *cobra.Command, args []string) {
	util.IfExit(ArgCheck(0, "eq", cmd, args))
	keyClient, err := keys.InitKeyClient(do.Signer)
	util.IfExit(err)

	_, err = keyClient.ListKeys(do.KeysPath, do.Quiet)
	util.IfExit(err)
}

func HealthCheck(cmd *cobra.Command, args []string) {
	util.IfExit(ArgCheck(0, "eq", cmd, args))
	keyClient := keys.NewKeyClient(do.Signer)
	err := keyClient.HealthCheck()
	util.IfExit(err)
}
