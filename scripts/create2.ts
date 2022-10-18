import { ethers } from 'hardhat';

function getCreate2Address() {
  const salt = '0x64e604787cbf194841e7b68d7cd28786f6c9a0a3ab9f8b0a0e87cb4387ab0107';
  const initCode = '0xe608a97b8eea4e07581a438c312f471f98fcacc959e7f3b35f93b3ff2f35e4ae'; // ERC20Pocket
  // const initCode = '0x4034e2e308e8ee2c827fdfa49b4b2d57c2b02f8fdd5c5b3b13e5a471ac24795a'; // NativePocket
  const create2Address = ethers.utils.getCreate2Address('0x300005c79c1c47e2b7d4741584A2eeDCc4cb94bc', salt, initCode);
  console.log(create2Address);
}

getCreate2Address();
