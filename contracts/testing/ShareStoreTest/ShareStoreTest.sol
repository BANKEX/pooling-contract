pragma solidity ^0.4.23;

import "../../abstract/Pool/ShareStore.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract ShareStoreTest is ShareStore {

  mapping (address => uint8) internal role_;

  uint8 internal state_;

  constructor(uint _minimalDeposit, address _tokenAddress) public {
    minimalDeposit = _minimalDeposit;
    tokenAddress = _tokenAddress;
  }

  function getInvestedSum() external view returns(uint) {
    return totalShare;
  }

  function setRole(uint8 _role) external {
    role_[msg.sender] = _role;
  }

  function getRole() external view returns(uint8) {
    return getRole_(msg.sender);
  }

  function getRole_() view internal returns(uint8) {
    return role_[msg.sender];
  }

  function getRole_(address _for) view internal returns(uint8) {
    return role_[_for];
  }

  function setState(uint8 _state) external {
    state_ = _state;
  }

  function getState() external view returns(uint8) {
    return getState_();
  }

  function getState_() internal view returns(uint8) {
    return state_;
  }

}