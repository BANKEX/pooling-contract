pragma solidity ^0.4.23;


import "./IRoleModel.sol";
import "./IStateModel.sol";


contract RoleModel is IRoleModel{
  mapping (address => uint8) internal role_;
  mapping (uint8 => address) internal roleAddress_;
  
  function setRole_(uint8 _for, address _afor) internal returns(bool) {
    require((role_[_afor]==0)&&(roleAddress_[_for]==address(0)));
    role_[_afor]=_for;
    roleAddress_[_for]=_afor;
  }

  function getRole_() view internal returns(uint8) {
    return role_[msg.sender];
  }

  function getRole_(address _for) view internal returns(uint8) {
    return role_[_for];
  }

  function getRoleAddress_(uint8 _for) view internal returns(address) {
    return roleAddress_[_for];
  }

  constructor () public {
    setRole_(RL_ADMIN, msg.sender);
  }

  function getRole(address _targetAddress) external view returns(uint8){
    return role_[_targetAddress];
  }

}