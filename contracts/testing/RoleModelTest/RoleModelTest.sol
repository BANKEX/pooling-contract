pragma solidity ^0.4.23;

import "../../abstract/Pool/RoleModel.sol";


contract RoleModelTest is RoleModel {

  function setRole(uint8 _role) external returns(bool) {
    setRole_(_role, msg.sender);
    return true;
  }

}