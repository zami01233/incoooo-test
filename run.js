require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Color configuration
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

// Logger configuration
const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  wallet: (msg) => console.log(`${colors.yellow}[➤] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
  banner: () => {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log(`---------------------------------------------`);
    console.log(` Comfy Inco Auto Bot - Humanized Pattern`);
    console.log(`---------------------------------------------${colors.reset}\n`);
  },
};

// Network configuration
const RPC_URL = 'https://sepolia.base.org';
const EXPLORER_URL = 'https://sepolia.basescan.org';
const USDC_ADDRESS = '0xAF33ADd7918F685B2A82C1077bd8c07d220FFA04';
const CUSDC_ADDRESS = '0xA449bc031fA0b815cA14fAFD0c5EdB75ccD9c80f';
// ABI configuration
const ERC20_ABI = [
  'function mint(address to, uint256 amount)',
  'function wrap(uint256 amount)',
  'function unwrap(uint256 amount)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Utility functions
function getRandomAmount() {
  return Math.floor(Math.random() * (781 - 933 + 1)) + 933;
}

function getRandomDelay(min = 12000, max = 21000) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Proxy management
function getRandomProxy(proxies) {
  return proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;
}

function createProvider(proxies) {
  const proxy = getRandomProxy(proxies);
  return proxy ?
    new ethers.JsonRpcProvider(RPC_URL, undefined, {
      staticNetwork: ethers.Network.from(84532),
      agent: new HttpsProxyAgent(proxy)
    }) :
    new ethers.JsonRpcProvider(RPC_URL);
}

// Core transaction functions
async function mintUSDC(wallet, provider, amount) {
  try {
    const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet.connect(provider));
    const tx = await contract.mint(wallet.address, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    logger.success(`[MINT] ${amount} USDC to ${wallet.address.slice(0,8)}`);
  } catch (error) {
    logger.error(`[MINT] Error: ${error.reason || error.message}`);
  }
}

async function mintCUSDC(wallet, provider, amount) {
  try {
    const contract = new ethers.Contract(CUSDC_ADDRESS, ERC20_ABI, wallet.connect(provider));
    const tx = await contract.mint(wallet.address, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    logger.success(`[MINT] ${amount} cUSDC to ${wallet.address.slice(0,8)}`);
  } catch (error) {
    logger.error(`[MINT] Error: ${error.reason || error.message}`);
  }
}

async function shieldUSDC(wallet, provider, amount) {
  try {
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet.connect(provider));
    const cusdc = new ethers.Contract(CUSDC_ADDRESS, ERC20_ABI, wallet.connect(provider));

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    await (await usdc.approve(CUSDC_ADDRESS, amountWei)).wait();
    await (await cusdc.wrap(amountWei)).wait();

    logger.success(`[SHIELD] ${amount} USDC for ${wallet.address.slice(0,8)}`);
  } catch (error) {
    logger.error(`[SHIELD] Error: ${error.reason || error.message}`);
  }
}

async function unshieldCUSDC(wallet, provider, amount) {
  try {
    const cusdc = new ethers.Contract(CUSDC_ADDRESS, ERC20_ABI, wallet.connect(provider));
    await (await cusdc.unwrap(ethers.parseUnits(amount.toString(), 18))).wait();
    logger.success(`[UNSHIELD] ${amount} cUSDC for ${wallet.address.slice(0,8)}`);
  } catch (error) {
    logger.error(`[UNSHIELD] Error: ${error.reason || error.message}`);
  }
}

// Main process
async function processWallet(wallet, proxies) {
  const provider = createProvider(proxies);
  const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

  try {
    const actions = shuffleArray(['mintUSDC', 'mintCUSDC', 'shield', 'unshield']);
    const amounts = {
      mintUSDC: getRandomAmount(),
      mintCUSDC: getRandomAmount(),
      shield: getRandomAmount(),
      unshield: getRandomAmount()
    };

    // Human-like delay between actions
    const humanDelay = () => sleep(getRandomDelay(1000, 5000));

    for (const action of actions) {
      switch(action) {
        case 'mintUSDC':
          await mintUSDC(walletInstance, createProvider(proxies), amounts.mintUSDC);
          break;
        case 'mintCUSDC':
          await mintCUSDC(walletInstance, createProvider(proxies), amounts.mintCUSDC);
          break;
        case 'shield':
          await shieldUSDC(walletInstance, createProvider(proxies), amounts.shield);
          break;
        case 'unshield':
          await unshieldCUSDC(walletInstance, createProvider(proxies), amounts.unshield);
          break;
      }
      await humanDelay();
    }
  } catch (error) {
    logger.error(`[WALLET] ${wallet.address.slice(0,8)} Error: ${error.message}`);
  }
}

async function main() {
  logger.banner();

  // Load proxies
  let proxies = [];
  try {
    proxies = fs.readFileSync('proxies.txt', 'utf8').split('\n').filter(p => p.trim());
    logger.info(`Loaded ${proxies.length} proxies`);
  } catch {
    logger.warn('Running without proxies');
  }

  // Load wallets
  const wallets = [];
  let index = 1;
  while (process.env[`PRIVATE_KEY_${index}`]) {
    const pk = process.env[`PRIVATE_KEY_${index}`];
    wallets.push({
      privateKey: pk,
      address: new ethers.Wallet(pk).address
    });
    index++;
  }

  if (!wallets.length) {
    logger.error('No wallets found in .env');
    process.exit(1);
  }
  logger.info(`Loaded ${wallets.length} wallets`);

  // Main loop
  while(true) {
    logger.info('🚀 Starting new randomized cycle...');

    await Promise.all(shuffleArray(wallets).map(wallet =>
      processWallet(wallet, proxies)
    ));

    const delay = getRandomDelay();
    logger.info(`⏳ Next cycle in ${(delay/1000).toFixed(1)} seconds...\n`);
    await sleep(delay);
  }
}

main().catch(error => {
  logger.error(`💀 Fatal error: ${error.message}`);
  process.exit(1);
});
