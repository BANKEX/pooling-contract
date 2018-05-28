pragma solidity ^0.4.23;

import "../../abstract/Pool/ShareStore.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract ShareStoreTest is ShareStore {

  uint8 internal role_;
  address internal roleAddress_;


  uint8 internal state_;

  constructor(uint _minimalDeposit, address _tokenAddress) public {
    minimalDeposit = _minimalDeposit;
    tokenAddress = _tokenAddress;
  }


  function setRoleTestData(uint8 _role, address _addr) external {
    role_ = _role;
    roleAddress_ = _addr;
  }


  function getRole_() view internal returns (uint8) {
    return role_;
  }

  function getRole_(address) view internal returns (uint8) {
    return role_;
  }
  
  function getRoleAddress_(uint8) view internal returns (address) {
    return roleAddress_;
  }


  function setState(uint8 _state) external {
    state_ = _state;
  }

  function getState() external view returns (uint8) {
    return getState_();
  }

  function getState_() internal view returns (uint8) {
    return state_;
  }

}