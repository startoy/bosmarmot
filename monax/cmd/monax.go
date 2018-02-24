package commands

import (
	"fmt"
	"io"
	"os"

	mkeys "github.com/monax/bosmarmot/keys/monax-keys"
	"github.com/monax/bosmarmot/monax/config"
	"github.com/monax/bosmarmot/monax/definitions"
	"github.com/monax/bosmarmot/monax/log"
	"github.com/monax/bosmarmot/monax/util"
	"github.com/monax/bosmarmot/project"
	"github.com/spf13/cobra"
)

// Defining the root command
var MonaxCmd = &cobra.Command{
	Use:   "monax COMMAND [FLAG ...]",
	Short: "The Ecosystem Application Platform",
	Long: `Monax is an application platform for building, testing, maintaining, and operating applications built to run on an ecosystem level.

Made with <3 by Monax Industries.

Complete documentation is available at https://monax.io/docs
` + "\nVersion:\n  " + project.History.CurrentVersion().String(),
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		log.SetLevel(log.WarnLevel)
		if do.Verbose {
			log.SetLevel(log.InfoLevel)
		} else if do.Debug {
			log.SetLevel(log.DebugLevel)
		}

		// Don't try to connect to Docker for informationalm
		// or bug fixing commands.
		switch cmd.Use {
		case "version", "update", "man":
			return
		}

	},

	PersistentPostRun: func(cmd *cobra.Command, args []string) {},
}

func Execute() {
	InitializeConfig()
	AddGlobalFlags()
	AddCommands()
	util.IfExit(MonaxCmd.Execute())
}

// Define the commands
func AddCommands() {
	buildPackagesCommand()
	buildKeysCommand()
	MonaxCmd.AddCommand(Packages)
	MonaxCmd.AddCommand(Keys)

	MonaxCmd.SetHelpCommand(Help)
	MonaxCmd.SetHelpTemplate(helpTemplate)
}

// Global Do struct
var do *definitions.Do

// Flags that are to be used by commands are handled by the Do struct
// Define the persistent commands (globals)
func AddGlobalFlags() {
	MonaxCmd.PersistentFlags().BoolVarP(&do.Verbose, "verbose", "v", false, "verbose output")
	MonaxCmd.PersistentFlags().BoolVarP(&do.Debug, "debug", "d", false, "debug level output")
	MonaxCmd.PersistentFlags().StringVarP(&mkeys.KeysDir, "keys-path", "", config.KeysPath,
		"root monax-keys directory that will be used to start keys if an instance is not already running")
}

func InitializeConfig() {
	var (
		err    error
		stdout io.Writer
		stderr io.Writer
	)

	do = definitions.NowDo()

	if os.Getenv("MONAX_CLI_WRITER") != "" {
		stdout, err = os.Open(os.Getenv("MONAX_CLI_WRITER"))
		if err != nil {
			log.Errorf("Could not open: %v", err)
			return
		}
	} else {
		stdout = os.Stdout
	}

	if os.Getenv("MONAX_CLI_ERROR_WRITER") != "" {
		stderr, err = os.Open(os.Getenv("MONAX_CLI_ERROR_WRITER"))
		if err != nil {
			log.Errorf("Could not open: %v", err)
			return
		}
	} else {
		stderr = os.Stderr
	}

	config.Global, err = config.New(stdout, stderr)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func ArgCheck(num int, comp string, cmd *cobra.Command, args []string) error {
	switch comp {
	case "eq":
		if len(args) != num {
			cmd.Help()
			return fmt.Errorf("\n**Note** you sent our marmots the wrong number of arguments.\nPlease send the marmots %d arguments only.", num)
		}
	case "ge":
		if len(args) < num {
			cmd.Help()
			return fmt.Errorf("\n**Note** you sent our marmots the wrong number of arguments.\nPlease send the marmots at least %d argument(s).", num)
		}
	}
	return nil
}

//restrict flag behaviour when needed (rare but used sometimes)
func FlagCheck(num int, comp string, cmd *cobra.Command, flags []string) error {
	switch comp {
	case "eq":
		if len(flags) != num {
			cmd.Help()
			return fmt.Errorf("\n**Note** you sent our marmots the wrong number of flags.\nPlease send the marmots %d flags only.", num)
		}
	case "ge":
		if len(flags) < num {
			cmd.Help()
			return fmt.Errorf("\n**Note** you sent our marmots the wrong number of flags.\nPlease send the marmots at least %d flag(s).", num)
		}
	}
	return nil
}
