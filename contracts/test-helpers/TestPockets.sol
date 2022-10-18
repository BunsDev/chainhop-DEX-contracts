// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

import "../ERC20Pocket.sol";
import "../NativePocket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestPockets {
    event Withdrawn(address to, address token, uint256 amount, address pocket);

    function withdraw(
        bytes32 swapId,
        address token,
        address to
    ) external {
        address pocket = address(new ERC20Pocket{salt: swapId}(token));
        uint256 amount = IERC20(token).balanceOf(pocket);
        require(amount > 0, "pocket no money");
        IERC20(token).transferFrom(pocket, to, amount);
        emit Withdrawn(to, token, amount, pocket);
    }

    function withdrawNative(bytes32 swapId, address to) external {
        uint256 balBefore = address(this).balance;
        address pocket = address(new NativePocket{salt: swapId}());
        uint256 amount = address(this).balance - balBefore;
        require(amount > 0, "pocket no money");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "failed to send native");
        emit Withdrawn(to, address(0), amount, pocket);
    }

    receive() external payable {}
}
