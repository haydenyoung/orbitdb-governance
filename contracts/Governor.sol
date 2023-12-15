// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./TokenLock.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Governor {
    address public owner;
    string public db;
    address public lock;

    struct Proposal {
        uint256 index;
        string proposalId;
        uint256 snapshot;
        uint256 duration;
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

    function propose(string calldata proposalId) public
    {
        bytes32 proposalHash = keccak256(abi.encode(proposalId));

        require(msg.sender == owner, "Governor: proposer must be owner");
        require(proposals[proposalHash].index == 0, "Governor: proposal already exists");

        uint256 snapshot = block.number + votingDelay();
        uint256 duration = snapshot + votingPeriod();

        proposalsIndex.push(proposalHash);
        proposals[proposalHash] = Proposal(proposalsIndex.length - 1, proposalId, snapshot, duration, "");
    }

    function votingDelay() public pure returns (uint256) {
        return 0;
    }

    function votingPeriod() public pure returns (uint256) {
        return 100;
    }

    function ratify(string calldata proposalHash, string calldata signedVotes) public {
        proposals[keccak256(abi.encode(proposalHash))].ratified = signedVotes;
    }

    function hashVotes(Vote[] memory votes) public pure returns (bytes32) {
        return keccak256(abi.encode(votes));
    }

    function canVote(string calldata proposalId, address voter, uint256 tokens) public view returns (bool) {
        Proposal memory proposal = proposals[keccak256(abi.encode(proposalId))];
        TokenLock tokenLock = TokenLock(lock);
        // Stake memory stake = tokenLock.stakes(voter);
        (address voter_, uint256 tokens_, uint256 duration_) = tokenLock.stakes(voter);

        Stake memory stake = Stake({ voter: voter_, tokens: tokens_, duration: duration_ });

        return
            stake.tokens > tokens &&
            proposal.snapshot < block.number &&
            stake.duration > proposal.duration;
    }
}
