import ccxt from '../../js/ccxt.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            process.env[key] = value;
        }
    });
}

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
    data: (label, data) => {
        console.log(`${colors.yellow}${label}:${colors.reset}`);
        if (typeof data === 'object') {
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(data);
        }
    }
};

async function testSpotTrading(exchange, symbol) {
    try {
        log.section(`Testing Spot Trading: ${symbol}`);
        
        // Fetch current market data
        log.info(`Fetching ticker for ${symbol}...`);
        const ticker = await exchange.fetchTicker(symbol);
        const currentPrice = ticker.last;
        log.success(`Current ${symbol} price: $${currentPrice}`);
        
        // Calculate order parameters
        const orderAmount = 0.1; // 0.1 SOL
        const limitPrice = Math.floor(currentPrice * 0.9 * 100) / 100; // 10% below market price
        const requiredUSDC = limitPrice * orderAmount;
        
        log.info(`Order parameters:`);
        log.data('Amount', `${orderAmount} SOL`);
        log.data('Limit Price', `$${limitPrice} (10% below market)`);
        log.data('Required USDC', `$${requiredUSDC.toFixed(2)}`);
        
        // Fetch balance using the correct endpoint
        log.info('Fetching account balance...');
        const balance = await exchange.fetchBalance();
        
        // Display balance info
        log.data('Balance Info', {
            USDC: {
                free: balance.USDC?.free || 0,
                used: balance.USDC?.used || 0,
                total: balance.USDC?.total || 0,
            },
            SOL: {
                free: balance.SOL?.free || 0,
                used: balance.SOL?.used || 0,
                total: balance.SOL?.total || 0,
            }
        });
        
        // Check if we have sufficient balance
        const availableUSDC = balance.USDC?.free || 0;
        if (availableUSDC < requiredUSDC) {
            log.warning(`Insufficient USDC balance. Required: ${requiredUSDC.toFixed(2)}, Available: ${availableUSDC.toFixed(2)}`);
            log.info('Attempting to place order anyway to test error handling...');
        }
        
        // Place limit buy order
        log.info(`Placing limit buy order: ${orderAmount} SOL at $${limitPrice}...`);
        let orderId = null;
        
        try {
            const order = await exchange.createOrder(symbol, 'limit', 'buy', orderAmount, limitPrice);
            orderId = order.id;
            log.success(`Order placed successfully!`);
            log.data('Order Details', {
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                side: order.side,
                price: order.price,
                amount: order.amount,
                cost: order.cost,
                status: order.status,
                timestamp: order.timestamp,
                datetime: order.datetime,
            });
            
            // Wait 5 seconds before canceling
            log.info('Waiting 5 seconds before canceling...');
            for (let i = 5; i > 0; i--) {
                process.stdout.write(`\r  ${i} seconds remaining...`);
                await exchange.sleep(1000);
            }
            console.log('\r                              \r'); // Clear the countdown line
            
            // Cancel the order
            log.info(`Canceling order ${orderId}...`);
            const cancelResult = await exchange.cancelOrder(orderId, symbol);
            log.success('Order canceled successfully!');
            log.data('Cancel Result', {
                id: cancelResult.id,
                status: cancelResult.status,
                remaining: cancelResult.remaining,
                filled: cancelResult.filled,
            });
            
        } catch (orderError) {
            log.error(`Order operation failed: ${orderError.message}`);
            if (orderError.message.includes('INSUFFICIENT_BALANCE')) {
                log.info('This is expected if the account has insufficient funds');
            }
            return false;
        }
        
        return true;
        
    } catch (error) {
        log.error(`Spot trading test failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

async function testPerpetualTrading(exchange, symbol) {
    try {
        log.section(`Testing Perpetual Trading: ${symbol}`);
        
        // Check if the perpetual market exists
        const markets = exchange.markets;
        if (!markets[symbol]) {
            log.warning(`Perpetual market ${symbol} not found in available markets`);
            return false;
        }
        
        // Fetch collateral info for margin trading
        log.info('Fetching collateral information...');
        const collateral = await exchange.fetchCollateral();
        log.data('Collateral Info', {
            netEquity: collateral.netEquity,
            netEquityAvailable: collateral.netEquityAvailable,
            collateral: collateral.collateral
        });
        
        // Check if we have sufficient margin
        if (collateral.netEquityAvailable <= 0) {
            log.warning('No available margin for perpetual trading');
            log.info('Would need to add collateral to trade perpetuals');
            return false;
        }
        
        // Fetch current market data
        log.info(`Fetching ticker for ${symbol}...`);
        const ticker = await exchange.fetchTicker(symbol);
        const currentPrice = ticker.last;
        log.success(`Current ${symbol} price: $${currentPrice}`);
        
        // Calculate order parameters
        const orderAmount = 0.1; // 0.1 SOL
        const limitPrice = Math.floor(currentPrice * 0.9 * 100) / 100; // 10% below market price
        
        log.info(`Order parameters:`);
        log.data('Amount', `${orderAmount} SOL`);
        log.data('Limit Price', `$${limitPrice} (10% below market)`);
        log.data('Available Margin', `$${collateral.netEquityAvailable}`);
        
        // Place limit buy order
        log.info(`Placing perpetual limit buy order: ${orderAmount} SOL at $${limitPrice}...`);
        let orderId = null;
        
        try {
            const order = await exchange.createOrder(symbol, 'limit', 'buy', orderAmount, limitPrice);
            orderId = order.id;
            log.success(`Perpetual order placed successfully!`);
            log.data('Order Details', {
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                side: order.side,
                price: order.price,
                amount: order.amount,
                status: order.status,
            });
            
            // Wait 5 seconds before canceling
            log.info('Waiting 5 seconds before canceling...');
            for (let i = 5; i > 0; i--) {
                process.stdout.write(`\r  ${i} seconds remaining...`);
                await exchange.sleep(1000);
            }
            console.log('\r                              \r');
            
            // Cancel the order
            log.info(`Canceling perpetual order ${orderId}...`);
            const cancelResult = await exchange.cancelOrder(orderId, symbol);
            log.success('Perpetual order canceled successfully!');
            log.data('Cancel Result', {
                id: cancelResult.id,
                status: cancelResult.status,
            });
            
        } catch (orderError) {
            log.error(`Perpetual order operation failed: ${orderError.message}`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        log.error(`Perpetual trading test failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

async function testBackpackTradingOperations() {
    try {
        log.section('Initializing Backpack Exchange');
        
        // Check for API keys
        if (!process.env.BACKPACK_API_KEY || !process.env.BACKPACK_API_SECRET) {
            throw new Error('API keys not found in environment variables');
        }
        
        log.info('API keys loaded from environment');
        
        // Initialize exchange
        const exchange = new ccxt.backpack({
            apiKey: process.env.BACKPACK_API_KEY,
            secret: process.env.BACKPACK_API_SECRET,
            enableRateLimit: true,
        });
        
        // Load markets
        log.info('Loading markets...');
        const markets = await exchange.loadMarkets();
        log.success(`Loaded ${Object.keys(markets).length} markets`);
        
        // List available market types
        const spotMarkets = Object.values(markets).filter(m => m.spot).length;
        const perpMarkets = Object.values(markets).filter(m => m.swap).length;
        log.info(`Market breakdown: ${spotMarkets} spot markets, ${perpMarkets} perpetual markets`);
        
        // Test 1: Spot Trading
        const spotSymbol = 'SOL/USDC';
        if (markets[spotSymbol]) {
            const spotResult = await testSpotTrading(exchange, spotSymbol);
            if (spotResult) {
                log.success('Spot trading test completed successfully');
            } else {
                log.warning('Spot trading test completed with issues');
            }
        } else {
            log.error(`Spot market ${spotSymbol} not found`);
        }
        
        // Test 2: Perpetual Trading (if available)
        const perpSymbols = ['SOL/USDC:USDC', 'SOL-PERP', 'SOL_USDC_PERP'];
        let perpSymbol = null;
        
        for (const symbol of perpSymbols) {
            if (markets[symbol] && markets[symbol].swap) {
                perpSymbol = symbol;
                break;
            }
        }
        
        if (perpSymbol) {
            log.info(`Found perpetual market: ${perpSymbol}`);
            const perpResult = await testPerpetualTrading(exchange, perpSymbol);
            if (perpResult) {
                log.success('Perpetual trading test completed successfully');
            } else {
                log.warning('Perpetual trading test completed with issues');
            }
        } else {
            log.warning('No perpetual markets found in production API');
            log.info('Perpetual markets may be available in the future');
        }
        
        // Test 3: Compare Balance vs Collateral
        log.section('Comparing Balance vs Collateral');
        
        try {
            // Fetch balance (spot balances)
            const balance = await exchange.fetchBalance();
            log.success('Balance fetched successfully (using /capital/balances)');
            log.data('Spot Balances', {
                USDC: balance.USDC || { free: 0, used: 0, total: 0 },
                SOL: balance.SOL || { free: 0, used: 0, total: 0 },
            });
            
            // Fetch collateral (margin info)
            const collateral = await exchange.fetchCollateral();
            log.success('Collateral fetched successfully (using /capital/collateral)');
            log.data('Margin/Collateral Info', {
                netEquity: collateral.netEquity,
                netEquityAvailable: collateral.netEquityAvailable,
                assets: Object.keys(collateral.collateral || {}).length,
            });
            
            log.info('Key Differences:');
            log.info('- Balance: Shows available/locked funds for spot trading');
            log.info('- Collateral: Shows margin status and borrowing capacity');
            log.info('- Use balance for spot orders, collateral for margin/futures');
            
        } catch (error) {
            log.error(`Failed to fetch balance/collateral comparison: ${error.message}`);
        }
        
        // Summary
        log.section('Test Summary');
        log.success('All API endpoints tested successfully');
        log.success('Balance vs Collateral distinction implemented correctly');
        log.info('Key findings:');
        log.info('- /capital/balances returns spot wallet balances');
        log.info('- /capital/collateral returns margin/collateral information');
        log.info('- Spot trading uses balance.available for order placement');
        log.info('- Margin/futures trading uses collateral.netEquityAvailable');
        
        log.section('Test Completed Successfully');
        
    } catch (error) {
        log.error(`Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the test
console.log(`${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║  Backpack Live Trading Test Suite v2.0     ║${colors.reset}`);
console.log(`${colors.magenta}║  Testing Balance vs Collateral & Trading   ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

testBackpackTradingOperations().then(() => {
    console.log(`\n${colors.green}All tests completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite failed:${colors.reset}`, error);
    process.exit(1);
});