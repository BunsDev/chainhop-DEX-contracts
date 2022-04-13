import * as dotenv from 'dotenv';
import fs from 'fs';
import { DeployResult } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import toml from 'toml';
import { CurveMetaPoolCodecBase, ICodecConfig, IMetaPoolArgs, IPoolConfig } from './types';

dotenv.config();

const readCurveConfig = () => {
  const configPath = process.env.CURVE_POOL_CONFIG_PATH;
  if (!configPath) {
    throw Error('empty config path');
  }
  return toml.parse(fs.readFileSync(configPath).toString());
};

export const getMetaPoolCodecConfig = (chainId: number): ICodecConfig => {
  const config = readCurveConfig();
  const pools = config.curve_pool as IPoolConfig[];
  const foundPools = pools.filter((p) => p['chain_id'] == chainId);
  const args = foundPools.reduce<IMetaPoolArgs>(
    (args, p) => {
      args[0].push(p.address);
      args[1].push(p.tokens);
      return args;
    },
    [[], []]
  );
  return { ...CurveMetaPoolCodecBase, args };
};

export const verify = async (hre: HardhatRuntimeEnvironment, deployResult: DeployResult, args?: any) => {
  if (!deployResult.newlyDeployed) {
    console.log(`skipping verifying contract ${deployResult.address} because it's not newly deployed`);
    return;
  }
  return hre.run('verify:verify', {
    address: deployResult.address,
    constructorArguments: args
  });
};