export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  chain: {
    id: parseInt(process.env.CHAIN_ID || '5888', 10),
    rpcUrl: process.env.RPC_URL || 'https://evm.mantrachain.io',
  },

  relayer: {
    privateKey: process.env.RELAYER_PRIVATE_KEY as `0x${string}`,
  },

  contracts: {
    delegatedAccount: process.env.DELEGATED_ACCOUNT_ADDRESS as `0x${string}`,
    token: {
      address: process.env.TOKEN_ADDRESS as `0x${string}`,
      decimals: parseInt(process.env.TOKEN_DECIMALS || '6', 10),
      symbol: process.env.TOKEN_SYMBOL || 'mantraUSD',
    },
  },

  fee: {
    enabled: process.env.FEE_ENABLED !== 'false',
    estimatedGas: parseInt(process.env.FEE_ESTIMATED_GAS || '150000', 10),
    bufferPercent: parseInt(process.env.FEE_BUFFER_PERCENT || '20', 10),
    min: parseFloat(process.env.FEE_MIN || '0.01'),
    max: parseFloat(process.env.FEE_MAX || '1.00'),
    quoteTtlSeconds: parseInt(process.env.FEE_QUOTE_TTL_SECONDS || '60', 10),
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  },

  health: {
    memoryHeapMB: parseInt(process.env.HEALTH_MEMORY_HEAP_MB || '512', 10),
  },

  maxGasPriceGwei: parseFloat(process.env.MAX_GAS_PRICE_GWEI || '100'),
});
