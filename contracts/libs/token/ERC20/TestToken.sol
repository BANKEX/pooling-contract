pragma solidity ^0.4.23;

import "./ERC20.sol";

contract TestToken is ERC20 {
  constructor(uint _totalSupply) public {
    totalSupply_ = _totalSupply;
    balances[msg.sender] = totalSupply_;
  }
}