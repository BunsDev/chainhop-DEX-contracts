// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

contract ERC20Pocket {
    constructor(address token) {
        (bool ok, ) = token.call(abi.encodeWithSelector(0x095ea7b3, msg.sender, ~0));
        require(ok);
    }
}
