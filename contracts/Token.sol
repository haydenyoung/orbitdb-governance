// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract GovernanceToken is ERC20, ERC20Permit {
    constructor()
        ERC20("GovernanceToken", "GVTR")
        ERC20Permit("GovernanceToken")
    {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
