// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";
struct Stake {
    address voter;
    uint256 tokens;
    uint256 duration;
}

contract TokenLock {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    address public owner;

    mapping (address => Stake) public stakes;

    constructor(ERC20 token_) {
        token = token_;
        owner = msg.sender;
    }

    function lock(address voter, uint256 amount, uint256 duration) external {
        token.safeTransferFrom(msg.sender, address(this), amount);

        stakes[voter] = Stake({ voter: msg.sender, tokens: amount, duration: duration });
    }

    function unlock(uint amount) external {
        require(stakes[msg.sender].tokens >= amount, "TokenLock: amount exceeds stake");
        stakes[msg.sender].tokens -= amount;
        token.safeTransfer(msg.sender, amount);
    }
}
