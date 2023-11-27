// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Governor {
    address public owner;
    
    struct Proposal {
        address proposer;
        string dbAddress;
        string proposalHash;
    }
    
    struct Vote {
        string voter;
        int256 tokens;
    }
    
    Proposal[] public proposals;
    
    mapping(uint256 => string) public ratifications;
    
    constructor() {
        owner = msg.sender;
    }    
    
    function propose(address proposer, string memory dbAddress, string memory proposalHash)
        public
    {
        proposals.push(Proposal(proposer, dbAddress, proposalHash));
    }
    
    function ratify(uint256 proposalId, string memory signedVotes) public {
        ratifications[proposalId] = signedVotes;
    }
    
    function hashVotes(Vote[] memory votes) public pure returns (bytes32) {
        return keccak256(abi.encode(votes));
    }
}