pragma solidity ^0.4.23;

contract IStateModel {
  uint8 constant ST_DEFAULT = 0x00;
  uint8 constant ST_RAISING = 0x01;
  uint8 constant ST_WAIT_FOR_ICO = 0x02;
  uint8 constant ST_MONEY_BACK = 0x04;
  uint8 constant ST_TOKEN_DISTRIBUTION = 0x08;
  uint8 constant ST_FUND_DEPRECATED = 0x10;

  uint8 constant TST_DEFAULT = 0x00;
  uint8 constant TST_RAISING = 0x01;
  uint8 constant TST_WAIT_FOR_ICO = 0x02;
  uint8 constant TST_TOKEN_DISTRIBUTION = 0x08;
  uint8 constant TST_FUND_DEPRECATED = 0x10;

  uint8 constant RST_NOT_COLLECTED = 0x01;
  uint8 constant RST_COLLECTED = 0x02;
  uint8 constant RST_FULL = 0x04;

  function getState_() internal view returns (uint8);
  function getShareRemaining_() internal view returns(uint);
}