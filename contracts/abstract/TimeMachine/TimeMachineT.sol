pragma solidity ^0.4.23;



/**
* @dev TimeMachine implementation to simulate time-dependence smart contract logic
*/
contract TimeMachineT {

  /**
  * @dev signed time offset for time emulation
  */
  uint internal timestampOffset_;
  
  /**
  * @dev get current emulated time
  * @return current emulated time
  */
  function getTimestamp_() internal view returns (uint) {
    return timestampOffset_ + block.timestamp;
  }

  /**
  * @dev set current emulated time
  * @param _time current emulated time
  * @return result of operation: true if success
  */
  function setTimestamp(uint _time) external returns (bool) { 
    timestampOffset_ = _time - block.timestamp;
    return true;
  }

  /**
  * @dev add delta to current emulated timestamp
  * @param _dTime delta increased to current emulated timestamp
  */
  function incTimestamp(uint _dTime) external returns (bool) {
    timestampOffset_ += _dTime;
    return true;
  }
}
