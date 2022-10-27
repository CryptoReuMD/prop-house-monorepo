// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import { UUPSUpgradeable } from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import { OwnableUpgradeable } from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import { IStrategyManager } from './interfaces/IStrategyManager.sol';
import { IUpgradeManager } from './interfaces/IUpgradeManager.sol';
import { IStarknetMessenger } from './interfaces/IStarknetMessenger.sol';
import { IHouse } from './interfaces/IHouse.sol';
import { Multicall } from './utils/Multicall.sol';

abstract contract HouseBase is IHouse, Multicall, UUPSUpgradeable, OwnableUpgradeable {
    // prettier-ignore
    // print(get_selector_from_name("create_house_strategy"))
    uint256 constant CREATE_STRATEGY_SELECTOR = 0x30b7e460d06ee4b7bb5f97430a8881944e86a98a4d7916a524d07c761ac4219;

    /// @notice A unique identifier
    bytes32 public immutable id;

    /// @notice The house implementation contract version
    uint256 public immutable version;

    /// @notice The Opt-In Upgrade Manager contract
    IUpgradeManager internal immutable _upgradeManager;

    /// @notice The Opt-In Strategy Manager contract
    IStrategyManager internal immutable _strategyManager;

    /// @notice The Starknet Messenger contract
    IStarknetMessenger internal immutable _messenger;

    /// @notice The L2 Strategy Factory contract address
    uint256 internal immutable _strategyFactory;

    /// @notice Determine if a house strategy is enabled
    mapping(address => bool) public isStrategyEnabled;

    constructor(
        string memory name_,
        uint256 version_,
        address upgradeManager_,
        address strategyManager_,
        address messenger_,
        uint256 strategyFactory_
    ) payable initializer {
        id = bytes32(bytes(name_));
        version = version_;

        _upgradeManager = IUpgradeManager(upgradeManager_);
        _strategyManager = IStrategyManager(strategyManager_);
        _messenger = IStarknetMessenger(messenger_);
        _strategyFactory = strategyFactory_;
    }

    /// @notice Enable a house strategy
    /// @param strategy The strategy to enable
    /// @dev This function is only callable by the house owner
    function enableStrategy(address strategy) external onlyOwner {
        _enableStrategy(strategy);
    }

    /// @notice Disable a house strategy
    /// @param strategy The strategy to disable
    /// @dev This function is only callable by the house owner
    function disableStrategy(address strategy) external onlyOwner {
        _disableStrategy(strategy);
    }

    /// @notice Enable many house strategies
    /// @param strategies The strategies to enable
    /// @dev This function is only callable by the house owner
    function enableManyStrategies(address[] calldata strategies) external onlyOwner {
        unchecked {
            uint256 numStrategies = strategies.length;
            for (uint256 i = 0; i < numStrategies; ++i) {
                _enableStrategy(strategies[i]);
            }
        }
    }

    /// @notice Disable many house strategies
    /// @param strategies The strategies to disable
    /// @dev This function is only callable by the house owner
    function disableManyStrategies(address[] calldata strategies) external onlyOwner {
        unchecked {
            uint256 numStrategies = strategies.length;
            for (uint256 i = 0; i < numStrategies; ++i) {
                _disableStrategy(strategies[i]);
            }
        }
    }

    /// @notice Initialize the house
    /// @param _creator The house creator
    function _initialize(address _creator) internal {
        __Ownable_init();

        // Transfer ownership to the DAO creator
        transferOwnership(_creator);
    }

    /// @notice Enable a house strategy
    function _enableStrategy(address strategy) internal {
        if (!_strategyManager.isValidStrategy(id, version, strategy)) {
            revert IStrategyManager.StrategyNotRegistered();
        }
        isStrategyEnabled[strategy] = true;

        emit StrategyEnabled(strategy);
    }

    /// @notice Disable a house strategy
    function _disableStrategy(address strategy) internal {
        _requireStrategyEnabled(strategy);
        isStrategyEnabled[strategy] = false;

        emit StrategyDisabled(strategy);
    }

    /// @notice Enable many house strategies
    function _enableManyStrategies(address[] memory strategies) internal {
        unchecked {
            uint256 numStrategies = strategies.length;
            for (uint256 i = 0; i < numStrategies; ++i) {
                _enableStrategy(strategies[i]);
            }
        }
    }

    /// @notice Ensures the caller is authorized to upgrade the contract to a valid implementation
    /// @dev This function is called in UUPS `upgradeTo` & `upgradeToAndCall`
    /// @param _newImpl The address of the new implementation
    function _authorizeUpgrade(address _newImpl) internal override onlyOwner {
        if (!_upgradeManager.isValidUpgrade(_getImplementation(), _newImpl)) {
            revert InvalidUpgrade();
        }
    }

    /// @notice Revert is the strategy is not enabled on the house
    function _requireStrategyEnabled(address strategy) internal view {
        if (!isStrategyEnabled[strategy]) {
            revert StrategyNotEnabled();
        }
    }
}
