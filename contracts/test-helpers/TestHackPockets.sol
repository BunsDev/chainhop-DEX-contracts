// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

import "../ERC20Pocket.sol";
import "../NativePocket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestHackPockets {
    event Withdrawn(address to, address token, uint256 amount, address pocket);

    function hack(
        bytes32 swapId,
        address token,
        address to
    ) external {
        address pocket;
        bytes memory code = type(ERC20Pocket).creationCode;
        assembly {
            pocket := create2(0x087f9fB215048ac4964FF00A3C1c730bd38e73Aa, add(code, 0x20), mload(code), swapId)
        }
        uint256 amount = IERC20(token).balanceOf(pocket);
        IERC20(token).transferFrom(pocket, to, amount);
        emit Withdrawn(to, token, amount, pocket);
    }

    receive() external payable {}
}
