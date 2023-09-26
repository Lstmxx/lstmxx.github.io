# 剑指 Offer II 103. 最少的硬币数目

给定不同面额的硬币 coins 和一个总金额 amount。编写一个函数来计算可以凑成总金额所需的最少的硬币个数。如果没有任何一种硬币组合能组成总金额，返回  -1。

你可以认为每种硬币的数量是无限的。

[链接](https://leetcode-cn.com/problems/gaM7Ch)

```ts
function coinChange(coins: number[], amount: number): number {
  const dpTable: Record<number, number> = {};
  function dp(n: number): number {
    if (dpTable[n]) return dpTable[n];
    if (n === 0) return 0;
    if (n < 0) return -1;
    let res = Number.POSITIVE_INFINITY;
    const coinsLen = coins.length;
    for (let i = 0; i < coinsLen; i++) {
      const num = dp(n - coins[i]);
      if (num === -1) continue;
      res = Math.min(res, 1 + num);
    }
    dpTable[n] = res === Number.POSITIVE_INFINITY ? -1 : res;
    return dpTable[n];
  }
  return dp(amount);
}
```
