pragma solidity ^0.4.23;


import "./IRoleModel.sol";
import "./IStateModel.sol";


contract RoleModel is IRoleModel{
  mapping (address => uint8) internal role_;

  function getRole_() view internal returns(uint8) {
    return role_[msg.sender];
  }

  function getRole_(address _for) view internal returns(uint8) {
    return role_[_for];
  }

  constructor () public {
    role_[msg.sender] = RL_ADMIN;
  }

  function getRole(address _targetAddress) external view returns(uint8){
    return role_[_targetAddress];
  }

}