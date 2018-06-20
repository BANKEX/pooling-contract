pragma solidity ^0.4.23;

contract Utils {
  function inSet(uint8 a, uint8 b) internal pure returns(bool){
    return (a & b) == a;
  }
}