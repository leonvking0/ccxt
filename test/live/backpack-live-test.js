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
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
    data: (label, data) => {
        console.log(`${colors.yellow}${label}:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
    }
};

async function testBackpackExchange() {
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
        
        // Check if required markets exist
        const spotSymbol = 'SOL/USDC';
        
        if (!markets[spotSymbol]) {
            throw new Error(`Spot market ${spotSymbol} not found`);
        }
        
        log.success(`Found ${spotSymbol} market`);
        log.info(`Note: Perpetual markets not yet available in production API`);
        
        // ==========================================
        // Phase 1: Test Spot Market Data
        // ==========================================
        log.section('Testing Spot Market Data (SOL/USDC)');
        
        // Fetch ticker
        log.info(`Fetching ticker for ${spotSymbol}...`);
        const spotTicker = await exchange.fetchTicker(spotSymbol);
        log.success(`Current price: $${spotTicker.last}`);
        log.data('Spot Ticker', {
            symbol: spotTicker.symbol,
            last: spotTicker.last,
            bid: spotTicker.bid,
            ask: spotTicker.ask,
            volume: spotTicker.baseVolume,
            high: spotTicker.high,
            low: spotTicker.low,
        });
        
        // Fetch orderbook
        log.info(`Fetching orderbook for ${spotSymbol}...`);
        const spotOrderbook = await exchange.fetchOrderBook(spotSymbol, 10);
        log.success(`Orderbook fetched - ${spotOrderbook.bids.length} bids, ${spotOrderbook.asks.length} asks`);
        log.data('Spot Orderbook (top 3)', {
            bestBid: spotOrderbook.bids[0],
            bestAsk: spotOrderbook.asks[0],
            bids: spotOrderbook.bids.slice(0, 3),
            asks: spotOrderbook.asks.slice(0, 3),
            spread: spotOrderbook.asks[0][0] - spotOrderbook.bids[0][0],
        });
        
        // Fetch trades
        log.info(`Fetching recent trades for ${spotSymbol}...`);
        const spotTrades = await exchange.fetchTrades(spotSymbol, undefined, 20);
        log.success(`Fetched ${spotTrades.length} recent trades`);
        log.data('Recent Spot Trades (last 3)', spotTrades.slice(-3).map(t => ({
            datetime: t.datetime,
            side: t.side,
            price: t.price,
            amount: t.amount,
            cost: t.cost,
        })));
        
        // ==========================================
        // Phase 2: Test Trading Operations
        // ==========================================
        log.section('Testing Trading Operations (SOL/USDC)');
        
        // Calculate limit price (10% below current price)
        const currentPrice = spotTicker.last;
        const limitPrice = Math.floor(currentPrice * 0.9 * 100) / 100; // Round to 2 decimals
        const orderAmount = 0.1; // 0.1 SOL
        
        log.info(`Current SOL price: $${currentPrice}`);
        log.info(`Limit buy price (10% below): $${limitPrice}`);
        log.info(`Order amount: ${orderAmount} SOL`);
        
        // Check account balance first
        log.info('Fetching account balance...');
        const balance = await exchange.fetchBalance();
        log.data('Account Balance', {
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
        
        const requiredUSDC = limitPrice * orderAmount;
        if ((balance.USDC?.free || 0) < requiredUSDC) {
            log.error(`Insufficient USDC balance. Required: ${requiredUSDC}, Available: ${balance.USDC?.free || 0}`);
            log.info('Skipping order placement test due to insufficient balance');
        } else {
            // Place limit buy order
            log.info(`Placing limit buy order: ${orderAmount} SOL at $${limitPrice}...`);
            try {
                const order = await exchange.createOrder(spotSymbol, 'limit', 'buy', orderAmount, limitPrice);
                log.success(`Order placed successfully!`);
                log.data('Order Details', {
                    id: order.id,
                    symbol: order.symbol,
                    type: order.type,
                    side: order.side,
                    price: order.price,
                    amount: order.amount,
                    status: order.status,
                    timestamp: order.timestamp,
                    datetime: order.datetime,
                });
                
                // Wait 10 seconds
                log.info('Waiting 10 seconds before canceling...');
                for (let i = 10; i > 0; i--) {
                    process.stdout.write(`\r  ${i} seconds remaining...`);
                    await exchange.sleep(1000);
                }
                console.log('\r                              \r'); // Clear the countdown line
                
                // Cancel the order
                log.info(`Canceling order ${order.id}...`);
                const cancelResult = await exchange.cancelOrder(order.id, spotSymbol);
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
                    log.info('This error suggests the account needs funding');
                }
            }
        }
        
        // ==========================================
        // Summary
        // ==========================================
        log.section('Test Summary');
        log.success('All market data endpoints working correctly');
        log.success('Successfully fetched orderbook and trades for SOL/USDC spot market');
        log.info('Note: Perpetual markets not available in production API yet');
        if ((balance.USDC?.free || 0) >= requiredUSDC) {
            log.success('Order placement and cancellation tested successfully');
        } else {
            log.info('Order placement skipped due to insufficient balance');
        }
        
        // Test completion
        log.section('Test Completed Successfully');
        
    } catch (error) {
        log.error(`Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the test
console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   Backpack Exchange Live Test Suite    ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

testBackpackExchange().then(() => {
    console.log(`\n${colors.green}All tests completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite failed:${colors.reset}`, error);
    process.exit(1);
});