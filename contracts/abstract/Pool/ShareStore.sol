pragma solidity ^0.4.23;


import "./IStateModel.sol";
import "./IRoleModel.sol";
import "./IShareStore.sol";
import "../../libs/math/SafeMath.sol";
import "../../libs/token/ERC20/IERC20.sol";


contract ShareStore is IRoleModel, IShareStore, IStateModel {
  using SafeMath for uint;
  uint public minimalDeposit;


  address public tokenAddress;

  mapping (address=>uint) public share;
  mapping (address=>uint) internal etherReleased_;
  mapping (address=>uint) internal tokenReleased_;

  uint public totalShare;
  uint public totalToken;
  
  mapping (uint8=>uint) public stakeholderShare;
  mapping (uint8=>uint) internal stakeholderEtherReleased_;



  uint constant DECIMAL_MULTIPLIER = 1e18;


  function getTotalShare_() internal view returns(uint){
    return totalShare;
  }

  function getEtherCollected_() internal view returns(uint){
    return totalShare;
  }

  function buyShare_(uint8 _state) internal returns(bool) {
    require(_state == ST_RAISING);
    require(msg.value >= minimalDeposit);
    uint _shareRemaining = getShareRemaining_();
    uint _shareAccept = (msg.value <= _shareRemaining) ? msg.value : _shareRemaining;

    share[msg.sender] = share[msg.sender].add(_shareAccept);
    totalShare = totalShare.add(_shareAccept);
    emit BuyShare(msg.sender, _shareAccept);
    if (msg.value!=_shareAccept) {
      msg.sender.transfer(msg.value.sub(_shareAccept));
    }
    return true;
  }

  function acceptTokenFromICO_(uint _value) internal returns(bool) {
    totalToken = totalToken.add(_value);
    emit AcceptTokenFromICO(msg.sender, _value);
    require(IERC20(tokenAddress).transferFrom(msg.sender, this, _value));
    return true;
  }

  function getStakeholderBalanceOf_(uint8 _for) internal view returns (uint) {
    if (_for == RL_ICO_MANAGER) {
      return getEtherCollected_().mul(stakeholderShare[_for]).div(DECIMAL_MULTIPLIER).sub(stakeholderEtherReleased_[_for]);
    }

    if ((_for == RL_POOL_MANAGER) || (_for == RL_ADMIN)) {
      return stakeholderEtherReleased_[RL_ICO_MANAGER].mul(stakeholderShare[_for]).div(stakeholderShare[RL_ICO_MANAGER]);
    }
    return 0;
  }

  function releaseEtherToStakeholder_(uint8 _state, uint8 _for, uint _value) internal returns (bool) {
    require(_for != RL_DEFAULT);
    require(_for != RL_PAYBOT);
    require(!((_for == RL_ICO_MANAGER) && (_state != ST_WAIT_FOR_ICO)));
    uint _balance = getStakeholderBalanceOf_(_for);
    address _afor = getRoleAddress_(_for);
    require(_balance >= _value);
    stakeholderEtherReleased_[_for] = stakeholderEtherReleased_[_for].add(_value);
    emit ReleaseEtherToStakeholder(_for, _afor, _value);
    _afor.transfer(_value);
    return true;
  }

  function getBalanceEtherOf_(address _for) internal view returns (uint) {
    uint _stakeholderTotalEtherReserved = stakeholderEtherReleased_[RL_ICO_MANAGER].mul(DECIMAL_MULTIPLIER).div(stakeholderShare[RL_ICO_MANAGER]);
    uint _restEther = getEtherCollected_().sub(_stakeholderTotalEtherReserved);
    return _restEther.mul(share[_for]).div(totalShare).sub(etherReleased_[_for]);
  }

  function getBalanceTokenOf_(address _for) internal view returns (uint) {
    return totalToken.mul(share[_for]).div(totalShare).sub(tokenReleased_[_for]);
  }

  function releaseEther_(address _for, uint _value) internal returns (bool) {
    uint _balance = getBalanceEtherOf_(_for);
    require(_balance >= _value);
    etherReleased_[_for] = etherReleased_[_for].add(_value);
    emit ReleaseEther(_for, _value);
    _for.transfer(_value);
    return true;
  }

  function releaseToken_( address _for, uint _value) internal returns (bool) {
    uint _balance = getBalanceTokenOf_(_for);
    require(_balance >= _value);
    tokenReleased_[_for] = tokenReleased_[_for].add(_value);
    emit ReleaseToken(_for, _value);
    require(IERC20(tokenAddress).transfer(_for, _value));
    return true;
  }

  function refundShare_(address _for, uint _value) internal returns(bool) {
    uint _balance = share[_for];
    require(_balance >= _value);
    share[_for] = _balance.sub(_value);
    totalShare = totalShare.sub(_value);
    emit RefundShare(_for, _value);
    _for.transfer(_value);
    return true;
  }
  
  /**
  * @dev Allow to buy part of tokens if current state is RAISING
  * @return result of operation, true if success
  */
  function buyShare() external payable returns(bool) {
    return buyShare_(getState_());
  }
  
  /**
  * @dev Allow (Important) ICO manager to say that _value amount of tokens is approved from ERC20 contract to this contract
  * @param _value amount of tokens that ICO manager approve from it's ERC20 contract to this contract
  * @return result of operation, true if success
  */
  function acceptTokenFromICO(uint _value) external returns(bool) {
    require(getState_() == ST_WAIT_FOR_ICO);
    require(getRole_() == RL_ICO_MANAGER);
    return acceptTokenFromICO_(_value);
  }
  
  /**
  * @dev Returns amount of ETH that stake holder (for example: ICO manager) can release from this contract
  * @param _for role of stakeholder (for example: 2)
  * @return amount of ETH in wei
  */
  function getStakeholderBalanceOf(uint8 _for) external view returns(uint) {
    return getStakeholderBalanceOf_(_for);
  }
  
  /**
  * @dev Returns amount of ETH that person can release from this contract
  * @param _for address of person
  * @return amount of ETH in wei
  */
  function getBalanceEtherOf(address _for) external view returns(uint) {
    return getBalanceEtherOf_(_for);
  }
  
  /**
  * @dev Returns amount of tokens that person can release from this contract
  * @param _for address of person
  * @return amount of tokens
  */
  function getBalanceTokenOf(address _for) external view returns(uint) {
    return getBalanceTokenOf_(_for);
  }
  
  /**
  * @dev Release amount of ETH to msg.sender (must be stakeholder)
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function releaseEtherToStakeholder(uint _value) external returns(bool) {
    return releaseEtherToStakeholder_(getState_(), getRole_(), _value);
  }
  
  /**
  * @dev Release amount of ETH to stakeholder by admin or paybot
  * @param _for stakeholder role (for example: 2)
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function releaseEtherToStakeholderForce(uint8 _for, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseEtherToStakeholder_(getState_(), _for, _value);
  }
  
  /**
  * @dev Release amount of ETH to msg.sender
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function releaseEther(uint _value) external returns(bool) {
    uint8 _state = getState_();
    require(_state == ST_TOKEN_DISTRIBUTION);
    return releaseEther_(msg.sender, _value);
  }
  
  /**
  * @dev Release amount of ETH to person by admin or paybot
  * @param _for address of person
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function releaseEtherForce(address _for, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    uint8 _state = getState_();
    require(_state == ST_TOKEN_DISTRIBUTION);
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseEther_(_for, _value);
  }
  
  /**
  * @dev Release amount of tokens to msg.sender
  * @param _value amount of tokens
  * @return result of operation, true if success
  */
  function releaseToken(uint _value) external returns(bool) {
    uint8 _state = getState_();
    require(_state == ST_TOKEN_DISTRIBUTION);
    return releaseToken_(msg.sender, _value);
  }
  
  /**
  * @dev Release amount of tokens to person by admin or paybot
  * @param _for address of person
  * @param _value amount of tokens
  * @return result of operation, true if success
  */
  function releaseTokenForce(address _for, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    uint8 _state = getState_();
    require(_state == ST_TOKEN_DISTRIBUTION);
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseToken_(_for, _value);
  }
  
  /**
  * @dev Allow to return ETH back to msg.sender if state Money back
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function refundShare(uint _value) external returns(bool) {
    uint8 _state = getState_();
    require (_state == ST_MONEY_BACK);
    return refundShare_(msg.sender, _value);
  }
  
  /**
  * @dev Allow to return ETH back to person by admin or paybot if state Money back
  * @param _for address of person
  * @param _value amount of ETH in wei
  * @return result of operation, true if success
  */
  function refundShareForce(address _for, uint _value) external returns(bool) {
    uint8 _state = getState_();
    uint8 _role = getRole_();
    require(_role == RL_ADMIN || _role == RL_PAYBOT);
    require (_state == ST_MONEY_BACK || _state == ST_RAISING);
    return refundShare_(_for, _value);
  }
  

  function () public payable {
    uint8 _state = getState_();
    if (_state == ST_RAISING){
      buyShare_(_state);
      return;
    }

    if (_state == ST_MONEY_BACK) {
      refundShare_(msg.sender, share[msg.sender]);
      if(msg.value > 0)
        msg.sender.transfer(msg.value);
      return;
    }

    if (_state == ST_TOKEN_DISTRIBUTION) {
      releaseEther_(msg.sender, getBalanceEtherOf_(msg.sender));
      releaseToken_(msg.sender, getBalanceTokenOf_(msg.sender));
      if(msg.value > 0)
        msg.sender.transfer(msg.value);
      return;
    }
    revert();
  }





}