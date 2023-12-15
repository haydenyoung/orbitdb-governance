// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
struct Stake {
    address voter;
    uint256 tokens;
    uint256 duration;
}

contract TokenLock {
    address public owner;

    mapping (address => Stake) public stakes;

    constructor() {
        owner = msg.sender;
    }

    function lock(address voter, uint256 tokens, uint256 duration) public {
        stakes[voter] = Stake({ voter: voter, tokens: tokens, duration: duration });
    }
}
