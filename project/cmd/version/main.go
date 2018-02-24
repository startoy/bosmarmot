package main

import (
	"fmt"

	"github.com/monax/bosmarmot/project"
)

func main() {
	fmt.Println(project.History.CurrentVersion().String())
}
