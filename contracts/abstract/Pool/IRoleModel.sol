pragma solidity ^0.4.23;



contract IRoleModel {
  uint8 constant RL_DEFAULT = 0x00;
  uint8 constant RL_POOL_MANAGER = 0x01;
  uint8 constant RL_ICO_MANAGER = 0x02;
  uint8 constant RL_ADMIN = 0x04;
  uint8 constant RL_PAYBOT = 0x08;

  function getRole_() view internal returns(uint8);
  function getRole_(address _for) view internal returns(uint8);
  function getRoleAddress_(uint8 _for) view internal returns(address);
  
}