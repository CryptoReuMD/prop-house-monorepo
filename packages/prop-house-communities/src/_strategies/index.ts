import { balanceOfErc721, balanceOfErc721StratArgs } from './balanceOfErc721';
import { balanceOfErc20, balanceOfErc20StratArgs } from './balanceOfErc20';
import { fixedNum, fixedNumStratArgs } from './fixedNum';
import { validEnsAndMinBal, validEnsAndMinBalStratArgs } from './validEnsAndMinBal';
import { thankApe, thankApeStratArgs } from './thankApe';
import { minimumBalance, minimumBalanceStratArgs } from './minimumBalance';

export const StrategyNames = [
  'balanceOfErc721',
  'balanceOfErc20',
  'fixedNum',
  'validEnsAndMinBal',
  'thankApe',
  'minimumBalance',
] as const;

export type StrategyName = typeof StrategyNames[number];

export type StrategyPayload =
  | balanceOfErc20StratArgs
  | balanceOfErc721StratArgs
  | fixedNumStratArgs
  | validEnsAndMinBalStratArgs
  | thankApeStratArgs
  | minimumBalanceStratArgs;

export const _strategies = {
  balanceOfErc721: balanceOfErc721,
  balanceOfErc20: balanceOfErc20,
  fixedNum: fixedNum,
  validEnsAndMinBal: validEnsAndMinBal,
  thankApe: thankApe,
  minimumBalance: minimumBalance,
};
