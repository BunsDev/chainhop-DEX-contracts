// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

contract NativePocket {
    constructor() {
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        require(ok);
    }
}
