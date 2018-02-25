package definitions

type Do struct {
	Quiet         bool   `mapstructure:"," json:"," yaml:"," toml:","`
	Verbose       bool   `mapstructure:"," json:"," yaml:"," toml:","`
	Version       bool   `mapstructure:"," json:"," yaml:"," toml:","`
	Debug         bool   `mapstructure:"," json:"," yaml:"," toml:","`
	Overwrite     bool   `mapstructure:"," json:"," yaml:"," toml:","`
	Address       string `mapstructure:"," json:"," yaml:"," toml:","`
	Type          string `mapstructure:"," json:"," yaml:"," toml:","`
	Name          string `mapstructure:"," json:"," yaml:"," toml:","`
	Path          string `mapstructure:"," json:"," yaml:"," toml:","`
	KeysPath      string `mapstructure:"," json:"," yaml:"," toml:","`
	ABIPath       string `mapstructure:"," json:"," yaml:"," toml:","`
	BinPath       string `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultGas    string `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultAddr   string `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultFee    string `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultAmount string `mapstructure:"," json:"," yaml:"," toml:","`

	// for [monax pkgs do]
	YAMLPath      string   `mapstructure:"," json:"," yaml:"," toml:","`
	ContractsPath string   `mapstructure:"," json:"," yaml:"," toml:","`
	Signer        string   `mapstructure:"," json:"," yaml:"," toml:","`
	PublicKey     string   `mapstructure:"," json:"," yaml:"," toml:","`
	ChainURL      string   `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultOutput string   `mapstructure:"," json:"," yaml:"," toml:","`
	DefaultSets   []string `mapstructure:"," json:"," yaml:"," toml:","`
	Package       *Package

	//data import/export
	Source      string `mapstructure:"," json:"," yaml:"," toml:","`
	Destination string `mapstructure:"," json:"," yaml:"," toml:","`
}

func NowDo() *Do {
	return &Do{}
}
