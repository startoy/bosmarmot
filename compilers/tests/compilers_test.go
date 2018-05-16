package compilersTest

import (
	"encoding/json"
	"os/exec"
	"reflect"
	"regexp"
	"strings"
	"testing"

	"github.com/monax/bosmarmot/compilers/definitions"
	"github.com/monax/bosmarmot/compilers/perform"
	"github.com/monax/bosmarmot/compilers/util"
	"github.com/monax/bosmarmot/monax/config"
	"github.com/stretchr/testify/assert"
)

func TestRequestCreation(t *testing.T) {
	var err error
	contractCode := `pragma solidity ^0.4.0;

contract c {
    function f() {
        uint8[5] memory foo3 = [1, 1, 1, 1, 1];
    }
}`

	var testMap = map[string]*definitions.IncludedFiles{
		"27fbf28c5dfb221f98526c587c5762cdf4025e85809c71ba871caa2ca42a9d85.sol": {
			ObjectNames: []string{"c"},
			Script:      []byte(contractCode),
		},
	}

	req, err := perform.CreateRequest("simpleContract.sol", "", false)

	if err != nil {
		t.Fatal(err)
	}
	if req.Libraries != "" {
		t.Errorf("Expected empty libraries, got %s", req.Libraries)
	}
	if req.Language != "sol" {
		t.Errorf("Expected Solidity file, got %s", req.Language)
	}
	if req.Optimize != false {
		t.Errorf("Expected false optimize, got true")
	}
	if !reflect.DeepEqual(req.Includes, testMap) {
		t.Errorf("Got incorrect Includes map, expected %v, got %v", testMap, req.Includes)
	}

}

// The solidity 0.4.21 compiler appends something called auxdata to the end of the bin file (this is visible with
// solc --asm). This is a swarm hash of the metadata, and it's always at the end. This includes the path of the
// solidity source file, so it will differ.
func trimAuxdata(bin string) string {
	return bin[:len(bin)-86]
}

func objectName(contract string) string {
	if contract == "" {
		return ""
	}
	parts := strings.Split(strings.TrimSpace(contract), ":")
	return parts[len(parts)-1]
}

func extractWarningJSON(output string) (warning string, json string) {
	jsonBeginsCertainly := strings.Index(output, `{"contracts":`)

	if jsonBeginsCertainly > 0 {
		warning = output[:jsonBeginsCertainly]
		json = output[jsonBeginsCertainly:]
	} else {
		json = output
	}
	return
}

func fixupCompilersResponse(resp *perform.Response, filename string) {
	for i := range resp.Objects {
		resp.Objects[i].Bytecode = trimAuxdata(resp.Objects[i].Bytecode)
	}
	// compilers changes the filename, change it back again in the warning
	re := regexp.MustCompile("[0-9a-f]+\\.sol")
	resp.Warning = re.ReplaceAllString(resp.Warning, filename)
}

func TestLocalMulti(t *testing.T) {
	util.ClearCache(config.SolcScratchPath)
	expectedSolcResponse := definitions.BlankSolcResponse()

	actualOutput, err := exec.Command("solc", "--combined-json", "bin,abi", "contractImport1.sol").CombinedOutput()
	if err != nil {
		t.Fatal(err)
	}

	warning, responseJSON := extractWarningJSON(strings.TrimSpace(string(actualOutput)))
	err = json.Unmarshal([]byte(responseJSON), expectedSolcResponse)

	respItemArray := make([]perform.ResponseItem, 0)

	for contract, item := range expectedSolcResponse.Contracts {
		respItem := perform.ResponseItem{
			Objectname: objectName(strings.TrimSpace(contract)),
			Bytecode:   trimAuxdata(strings.TrimSpace(item.Bin)),
			ABI:        strings.TrimSpace(item.Abi),
		}
		respItemArray = append(respItemArray, respItem)
	}
	expectedResponse := &perform.Response{
		Objects: respItemArray,
		Warning: warning,
		Version: "",
		Error:   "",
	}
	util.ClearCache(config.SolcScratchPath)
	resp, err := perform.RequestCompile("contractImport1.sol", false, "")
	if err != nil {
		t.Fatal(err)
	}
	fixupCompilersResponse(resp, "contractImport1.sol")
	allClear := true
	for _, object := range expectedResponse.Objects {
		if !contains(resp.Objects, object) {
			allClear = false
		}
	}
	if !allClear {
		t.Errorf("Got incorrect response, expected %v, \n\n got %v", expectedResponse, resp)
	}
	util.ClearCache(config.SolcScratchPath)
}

func TestLocalSingle(t *testing.T) {
	util.ClearCache(config.SolcScratchPath)
	expectedSolcResponse := definitions.BlankSolcResponse()

	shellCmd := exec.Command("solc", "--combined-json", "bin,abi", "simpleContract.sol")
	actualOutput, err := shellCmd.CombinedOutput()
	if err != nil {
		t.Fatal(err)
	}

	warning, responseJSON := extractWarningJSON(strings.TrimSpace(string(actualOutput)))
	err = json.Unmarshal([]byte(responseJSON), expectedSolcResponse)

	respItemArray := make([]perform.ResponseItem, 0)

	for contract, item := range expectedSolcResponse.Contracts {
		respItem := perform.ResponseItem{
			Objectname: objectName(strings.TrimSpace(contract)),
			Bytecode:   trimAuxdata(strings.TrimSpace(item.Bin)),
			ABI:        strings.TrimSpace(item.Abi),
		}
		respItemArray = append(respItemArray, respItem)
	}
	expectedResponse := &perform.Response{
		Objects: respItemArray,
		Warning: warning,
		Version: "",
		Error:   "",
	}
	util.ClearCache(config.SolcScratchPath)
	resp, err := perform.RequestCompile("simpleContract.sol", false, "")
	if err != nil {
		t.Fatal(err)
	}
	fixupCompilersResponse(resp, "simpleContract.sol")
	assert.Equal(t, expectedResponse, resp)
	util.ClearCache(config.SolcScratchPath)
}

func TestFaultyContract(t *testing.T) {
	util.ClearCache(config.SolcScratchPath)
	var expectedSolcResponse perform.Response

	actualOutput, err := exec.Command("solc", "--combined-json", "bin,abi", "faultyContract.sol").CombinedOutput()
	err = json.Unmarshal(actualOutput, expectedSolcResponse)
	t.Log(expectedSolcResponse.Error)
	resp, err := perform.RequestCompile("faultyContract.sol", false, "")
	t.Log(resp.Error)
	if err != nil {
		if expectedSolcResponse.Error != resp.Error {
			t.Errorf("Expected %v got %v", expectedSolcResponse.Error, resp.Error)
		}
	}
	output := strings.TrimSpace(string(actualOutput))
	err = json.Unmarshal([]byte(output), expectedSolcResponse)
}

func contains(s []perform.ResponseItem, e perform.ResponseItem) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
