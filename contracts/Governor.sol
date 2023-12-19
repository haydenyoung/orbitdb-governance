// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./TokenLock.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Governor is Ownable {
    string public db;
    address public lock;

    struct Proposal {
        uint256 index;
        string proposalId;
        uint256 snapshot;
        uint256 duration;
        uint256 contest;
        string votes;
    }

    struct Vote {
        string voter;
        uint256 tokens;
        uint256 selection;
    }

    struct Contest {
        address voter;
        string votes;
    }

    bytes32[] public proposalsIndex;
    mapping (bytes32 => Proposal) public proposals;

    mapping (bytes32 => uint256) public contestCount;
    mapping (bytes32 => Contest[]) public contests;

    constructor(address lock_, string memory db_) Ownable(msg.sender) {
        lock = lock_;
        db = db_;
    }

    function propose(string calldata proposalId) onlyOwner public
    {
        bytes32 proposalHash = keccak256(abi.encode(proposalId));
        require(proposals[proposalHash].index == 0, "Governor: proposal already exists");

        uint256 snapshot = block.number + votingDelay();
        uint256 duration = snapshot + votingPeriod();
        uint256 contest = duration + contestPeriod();

        proposalsIndex.push(proposalHash);
        proposals[proposalHash] = Proposal(proposalsIndex.length - 1, proposalId, snapshot, duration, contest, "");
    }

    function votingDelay() public pure returns (uint256) {
        return 0;
    }

    function votingPeriod() public pure returns (uint256) {
        return 100;
    }

    function contestPeriod() public pure returns (uint256) {
        return 5;
    }

    function publishVotes(string calldata proposalId, string calldata hashedVotes) onlyOwner public {
        proposals[keccak256(abi.encode(proposalId))].votes = hashedVotes;
    }

    function contest(string calldata proposalId, string calldata hashedVotes) public {
        TokenLock tokenLock = TokenLock(lock);
        (address voter, uint256 tokens, ) = tokenLock.stakes(msg.sender);

        require(!canContest(proposalId, voter, tokens), "Governor: cannot contest");

        bytes32 proposalHash = keccak256(abi.encode(proposalId));

        contests[proposalHash].push(Contest(voter, hashedVotes));
        contestCount[proposalHash] = contests[proposalHash].length;
    }

    function hashVotes(Vote[] memory votes) public pure returns (bytes32) {
        return keccak256(abi.encode(votes));
    }

    function canContest(string calldata proposalId, address voter_, uint256 tokens_) public view returns (bool) {
        TokenLock tokenLock = TokenLock(lock);
        // Stake memory stake = tokenLock.stakes(voter);
        (address voter, uint256 tokens, uint256 end ) = tokenLock.stakes(voter_);

        TokenLock.Stake memory stake = TokenLock.Stake({ voter: voter, tokens: tokens, end: end });

        Proposal memory proposal = proposals[keccak256(abi.encode(proposalId))];

        return
            stake.tokens > tokens &&
            stake.end > proposal.contest;
    }

    function canVote(string calldata proposalId, address voter_, uint256 tokens_) public view returns (bool) {
        Proposal memory proposal = proposals[keccak256(abi.encode(proposalId))];
        TokenLock tokenLock = TokenLock(lock);
        // Stake memory stake = tokenLock.stakes(voter);
        (address voter, uint256 tokens, uint256 end) = tokenLock.stakes(voter_);

        TokenLock.Stake memory stake = TokenLock.Stake({ voter: voter, tokens: tokens, end: end });

        return
            stake.tokens > tokens_ &&
            proposal.snapshot < block.number &&
            stake.end > proposal.duration;
    }
}
