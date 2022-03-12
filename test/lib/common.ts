import { parseUnits } from '@ethersproject/units';
import { Wallet } from '@ethersproject/wallet';
import { Fixture } from 'ethereum-waffle/dist/esm';
import { ethers, waffle } from 'hardhat';
import {
  Bridge,
  Bridge__factory,
  CurvePoolCodec__factory,
  MessageBus,
  MessageBus__factory,
  MockUniswapV2,
  MockUniswapV2__factory,
  TestERC20,
  TestERC20__factory,
  TransferSwapper,
  TransferSwapper__factory,
  UniswapV2SwapExactTokensForTokensCodec__factory,
  UniswapV3ExactInputSingleCodec__factory,
  WETH
} from '../../typechain';
import { WETH__factory } from './../../typechain/factories/WETH__factory';
import * as consts from './constants';

// Workaround for https://github.com/nomiclabs/hardhat/issues/849
// TODO: Remove once fixed upstream.
export function loadFixture<T>(fixture: Fixture<T>): Promise<T> {
  const provider = waffle.provider;
  return waffle.createFixtureLoader(provider.getWallets(), provider)(fixture);
}

export interface BridgeContracts {
  bridge: Bridge;
  messageBus: MessageBus;
}

export interface ChainHopContracts {
  xswap: TransferSwapper;
  mockV2: MockUniswapV2;
}

export interface TokenContracts {
  tokenA: TestERC20;
  tokenB: TestERC20;
  weth: WETH;
}

export async function deployBridgeContracts(admin: Wallet): Promise<BridgeContracts> {
  const bridgeFactory = (await ethers.getContractFactory('Bridge')) as Bridge__factory;
  const bridge = await bridgeFactory.connect(admin).deploy();
  await bridge.deployed();

  const messageBusFactory = (await ethers.getContractFactory('MessageBus')) as MessageBus__factory;
  const messageBus = await messageBusFactory
    .connect(admin)
    .deploy(
      bridge.address,
      bridge.address,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );
  await messageBus.deployed();

  return { bridge, messageBus };
}

export async function deployChainhopContracts(
  admin: Wallet,
  weth: string,
  signer: string,
  feeCollector: string,
  messageBus: string
): Promise<ChainHopContracts> {
  const mockV2Factory = (await ethers.getContractFactory('MockUniswapV2')) as MockUniswapV2__factory;
  const mockV2 = await mockV2Factory.connect(admin).deploy(parseUnits('5')); // 5% fixed fake slippage
  await mockV2.deployed();

  const v2CodecFactory = (await ethers.getContractFactory(
    'UniswapV2SwapExactTokensForTokensCodec'
  )) as UniswapV2SwapExactTokensForTokensCodec__factory;
  const v2Codec = await v2CodecFactory.connect(admin).deploy();
  await v2Codec.deployed();

  const v3CodecFactory = (await ethers.getContractFactory(
    'UniswapV3ExactInputSingleCodec'
  )) as UniswapV3ExactInputSingleCodec__factory;
  const v3Codec = await v3CodecFactory.connect(admin).deploy();
  await v3Codec.deployed();

  const curveCodecFactory = (await ethers.getContractFactory('CurvePoolCodec')) as CurvePoolCodec__factory;
  const curveCodec = await curveCodecFactory.connect(admin).deploy();
  await curveCodec.deployed();

  const transferSwapperFactory = (await ethers.getContractFactory('TransferSwapper')) as TransferSwapper__factory;
  const xswap = await transferSwapperFactory
    .connect(admin)
    .deploy(
      messageBus,
      weth,
      signer,
      feeCollector,
      [
        'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
        'exactInputSingle(address,address,uint24,address,uint256,uint256,uint256,uint160)',
        'exchange(int128,int128,uint256,uint256)'
      ],
      [v2Codec.address, v3Codec.address, curveCodec.address]
    );
  await xswap.deployed();

  return { xswap, mockV2 };
}

export async function deployTokenContracts(admin: Wallet): Promise<TokenContracts> {
  const wethFactory = (await ethers.getContractFactory('WETH')) as WETH__factory;
  const weth = await wethFactory.connect(admin).deploy();
  await weth.deployed();

  const testERC20Factory = (await ethers.getContractFactory('TestERC20')) as TestERC20__factory;
  const tokenA = await testERC20Factory.connect(admin).deploy();
  await tokenA.deployed();
  const tokenB = await testERC20Factory.connect(admin).deploy();
  await tokenB.deployed();
  return { weth, tokenA, tokenB };
}

export async function getAccounts(admin: Wallet, assets: TestERC20[], num: number): Promise<Wallet[]> {
  const accounts: Wallet[] = [];
  for (let i = 0; i < num; i++) {
    accounts.push(new ethers.Wallet(consts.userPrivKeys[i]).connect(ethers.provider));
    await admin.sendTransaction({
      to: accounts[i].address,
      value: parseUnits('10')
    });
    for (let j = 0; j < assets.length; j++) {
      await assets[j].transfer(accounts[i].address, parseUnits('1000'));
    }
  }
  accounts.sort((a, b) => (a.address.toLowerCase() > b.address.toLowerCase() ? 1 : -1));
  return accounts;
}

export async function advanceBlockNumber(blkNum: number): Promise<void> {
  const promises = [];
  for (let i = 0; i < blkNum; i++) {
    promises.push(ethers.provider.send('evm_mine', []));
  }
  await Promise.all(promises);
}

export async function advanceBlockNumberTo(target: number): Promise<void> {
  const blockNumber = await ethers.provider.getBlockNumber();
  const promises = [];
  for (let i = blockNumber; i < target; i++) {
    promises.push(ethers.provider.send('evm_mine', []));
  }
  await Promise.all(promises);
}