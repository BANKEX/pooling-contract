pragma solidity ^0.4.23;


/**
* @dev TimeMachine implementation for production
*/
contract TimeMachineP {
  
  /**
  * @dev get current real timestamp
  * @return current real timestamp
  */
  function getTimestamp_() internal view returns(uint) {
    return block.timestamp;
  }
}
