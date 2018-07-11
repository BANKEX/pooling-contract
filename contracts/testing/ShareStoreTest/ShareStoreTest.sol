pragma solidity ^0.4.23;

import "../../abstract/Pool/ShareStore.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract ShareStoreTest is ShareStore, TimeMachineT {

  uint8 internal role_;
  address internal roleAddress_;
  
  uint256 public max_value_test = 2 ** 256 - 1;
  

  uint8 internal state_;
  uint maximalFundSize;

  constructor(uint _minimalDeposit, address _tokenAddress, uint _tokenPrice) public {
    maximalFundSize = 1000000000000000000000;
    minimalDeposit = _minimalDeposit;
    tokenAddress = _tokenAddress;
    stakeholderShare[1] = 40000000000000000;
    stakeholderShare[2] = 950000000000000000;
    stakeholderShare[4] = 10000000000000000;
    tokenPrice = _tokenPrice;
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
  
  function getShareRemaining_() internal view returns(uint)
  {
    return maximalFundSize.sub(getTotalShare_());
  }
  
  
  
}