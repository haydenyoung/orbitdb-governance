// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Governor {
    address public owner;
    string public db;
    address public lock;

    struct Proposal {
        uint256 index;
        string proposalId;
        string ratified;
    }

    struct Vote {
        string voter;
        uint256 tokens;
        uint256 selection;
    }

    bytes32[] public proposalsIndex;
    mapping (bytes32 => Proposal) public proposals;

    constructor(address lock_, string memory db_) {
        owner = msg.sender;
        lock = lock_;
        db = db_;
    }

    function propose(string calldata proposalHash) public
    {
        require(msg.sender == owner, "Governor: proposer must be owner");
        require(proposals[keccak256(abi.encode(proposalHash))].index == 0, "Governor: proposal already exists");
        proposalsIndex.push(keccak256(abi.encode(proposalHash)));
        proposals[keccak256(abi.encode(proposalHash))] = Proposal(proposalsIndex.length - 1, proposalHash, "");
    }

    function ratify(string calldata proposalHash, string calldata signedVotes) public {
        proposals[keccak256(abi.encode(proposalHash))].ratified = signedVotes;
    }

    function hashVotes(Vote[] memory votes) public pure returns (bytes32) {
        return keccak256(abi.encode(votes));
    }
}
