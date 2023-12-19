// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract TokenLock {
    struct Stake {
        address voter;
        uint256 tokens;
        uint256 end; // block number + duration
    }

    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    address public owner;

    mapping (address => Stake) public stakes;

    constructor(ERC20 token_) {
        token = token_;
        owner = msg.sender;
    }

    function lock(uint256 amount, uint256 duration) external {
        token.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = Stake({ voter: msg.sender, tokens: amount, end: block.number + duration });
    }

    function unlock(uint amount) external {
        require(stakes[msg.sender].tokens >= amount, "TokenLock: amount exceeds stake");
        require(stakes[msg.sender].end < block.number, "TokenLock: duration is less than block number");

        stakes[msg.sender].end = 0;
        stakes[msg.sender].tokens -= amount;
        token.safeTransfer(msg.sender, amount);
    }
}
