pragma solidity ^0.4.23;

import "../../abstract/Pool/RoleModel.sol";


contract RoleModelTest is RoleModel {

  function setRole(uint8 _role) external returns(bool) {
    role_[msg.sender] = _role;
    return true;
  }

  function getRole() view external returns(uint8) {
    return role_[msg.sender];
  }

  constructor () public {
    role_[msg.sender] = RL_ADMIN;
  }
}