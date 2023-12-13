// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract TokenLock {
    address public owner;

    struct Stake {
        address voter;
        uint256 tokens;
        uint256 duration;
    }

    mapping (address => Stake) public stakes;

    constructor() {
        owner = msg.sender;
    }

    function lock(address voter, uint256 tokens, uint256 duration) public {
        stakes[voter] = Stake({ voter: voter, tokens: tokens, duration: duration });
    }

    function canVote(address voter, uint256 tokens) public view returns (bool) {
        Stake memory stake = stakes[voter];
        return stake.tokens > tokens && stake.duration > block.number;
    }
}
