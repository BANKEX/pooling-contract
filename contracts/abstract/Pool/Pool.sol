pragma solidity ^0.4.23;

import "./RoleModel.sol";
import "./StateModel.sol";
import "./ShareStore.sol";


contract Pool is ShareStore, StateModel, RoleModel {
}