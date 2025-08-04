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
    gray: '\x1b[90m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
    subsection: (msg) => console.log(`\n${colors.magenta}--- ${msg} ---${colors.reset}`),
    data: (label, data) => {
        console.log(`${colors.yellow}${label}:${colors.reset}`);
        if (typeof data === 'object') {
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(data);
        }
    },
    dim: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`),
};

// Test statistics
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    warnings: 0,
};

// Helper function to run a test
async function runTest(name, testFn) {
    stats.total++;
    try {
        log.info(`Testing ${name}...`);
        const result = await testFn();
        if (result === 'skip') {
            stats.skipped++;
            log.warning(`${name} - SKIPPED`);
        } else {
            stats.passed++;
            log.success(`${name} - PASSED`);
        }
        return true;
    } catch (error) {
        stats.failed++;
        log.error(`${name} - FAILED: ${error.message}`);
        if (process.env.VERBOSE) {
            console.error(error);
        }
        return false;
    }
}

// Test fetchOHLCV
async function testFetchOHLCV(exchange) {
    log.subsection('Testing fetchOHLCV');
    
    const symbol = 'SOL/USDC';
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
    const limit = 10;
    
    for (const timeframe of timeframes) {
        await runTest(`fetchOHLCV ${symbol} ${timeframe}`, async () => {
            const since = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
            const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
            
            if (!Array.isArray(ohlcv)) {
                throw new Error('OHLCV data is not an array');
            }
            
            if (ohlcv.length === 0) {
                log.warning('No OHLCV data returned');
                return;
            }
            
            // Validate OHLCV structure
            const candle = ohlcv[0];
            if (!Array.isArray(candle) || candle.length !== 6) {
                throw new Error('Invalid OHLCV candle structure');
            }
            
            const [timestamp, open, high, low, close, volume] = candle;
            if (typeof timestamp !== 'number' || timestamp <= 0) {
                throw new Error('Invalid timestamp in OHLCV data');
            }
            
            log.dim(`  Returned ${ohlcv.length} candles, latest: ${new Date(timestamp).toISOString()}`);
            log.dim(`  Price range: ${low} - ${high}, Volume: ${volume}`);
        });
    }
}

// Test fetchTickers
async function testFetchTickers(exchange) {
    log.subsection('Testing fetchTickers');
    
    await runTest('fetchTickers (all markets)', async () => {
        const tickers = await exchange.fetchTickers();
        
        if (typeof tickers !== 'object') {
            throw new Error('Tickers response is not an object');
        }
        
        const tickerCount = Object.keys(tickers).length;
        if (tickerCount === 0) {
            throw new Error('No tickers returned');
        }
        
        log.dim(`  Returned ${tickerCount} tickers`);
        
        // Validate a sample ticker
        const sampleSymbol = Object.keys(tickers)[0];
        const ticker = tickers[sampleSymbol];
        
        if (!ticker.symbol || ticker.last === undefined) {
            throw new Error('Invalid ticker structure - missing symbol or last price');
        }
        
        // Note: Backpack tickers don't include bid/ask prices in the /tickers endpoint
        log.dim(`  Sample ticker ${sampleSymbol}: Last=${ticker.last}, High=${ticker.high}, Low=${ticker.low}, Volume=${ticker.baseVolume}`);
    });
    
    await runTest('fetchTickers (specific symbols)', async () => {
        const symbols = ['SOL/USDC', 'BTC/USDC'];
        const tickers = await exchange.fetchTickers(symbols);
        
        // Should still return all tickers but we filter locally
        const filteredCount = Object.keys(tickers).filter(s => symbols.includes(s)).length;
        log.dim(`  Found ${filteredCount} of requested symbols`);
    });
}

// Test fetchCurrencies
async function testFetchCurrencies(exchange) {
    log.subsection('Testing fetchCurrencies');
    
    await runTest('fetchCurrencies', async () => {
        const currencies = await exchange.fetchCurrencies();
        
        if (typeof currencies !== 'object') {
            throw new Error('Currencies response is not an object');
        }
        
        const currencyCount = Object.keys(currencies).length;
        if (currencyCount === 0) {
            throw new Error('No currencies returned');
        }
        
        log.dim(`  Returned ${currencyCount} currencies`);
        
        // Check for common currencies
        const commonCurrencies = ['BTC', 'SOL', 'USDC'];
        for (const code of commonCurrencies) {
            if (currencies[code]) {
                const currency = currencies[code];
                log.dim(`  ${code}: Active=${currency.active}, Networks=${Object.keys(currency.networks || {}).length}`);
            }
        }
    });
}

// Test order history methods
async function testOrderHistory(exchange) {
    log.subsection('Testing Order History Methods');
    
    await runTest('fetchOrders (all)', async () => {
        const orders = await exchange.fetchOrders();
        
        if (!Array.isArray(orders)) {
            throw new Error('Orders response is not an array');
        }
        
        log.dim(`  Returned ${orders.length} orders from history`);
        
        if (orders.length > 0) {
            const order = orders[0];
            log.dim(`  Sample order: ${order.id} ${order.side} ${order.amount} ${order.symbol} @ ${order.price}`);
        }
    });
    
    await runTest('fetchOrders (by symbol)', async () => {
        const symbol = 'SOL/USDC';
        const orders = await exchange.fetchOrders(symbol);
        
        if (!Array.isArray(orders)) {
            throw new Error('Orders response is not an array');
        }
        
        const matchingOrders = orders.filter(o => o.symbol === symbol);
        log.dim(`  Found ${matchingOrders.length} orders for ${symbol}`);
    });
    
    await runTest('fetchClosedOrders', async () => {
        const orders = await exchange.fetchClosedOrders();
        
        if (!Array.isArray(orders)) {
            throw new Error('Closed orders response is not an array');
        }
        
        const closedStatuses = ['closed', 'canceled', 'filled'];
        const closedOrders = orders.filter(o => closedStatuses.includes(o.status));
        log.dim(`  Found ${closedOrders.length} closed orders`);
    });
    
    await runTest('fetchOrder (by ID)', async () => {
        // First get an order ID from history
        const orders = await exchange.fetchOrders(undefined, undefined, 1);
        
        if (orders.length === 0) {
            log.warning('No orders in history to test fetchOrder');
            return 'skip';
        }
        
        const orderId = orders[0].id;
        const order = await exchange.fetchOrder(orderId);
        
        if (!order || order.id !== orderId) {
            throw new Error('fetchOrder returned incorrect order');
        }
        
        log.dim(`  Successfully fetched order ${orderId}`);
    });
}

// Test deposit/withdrawal history
async function testCapitalHistory(exchange) {
    log.subsection('Testing Capital Management History');
    
    await runTest('fetchDeposits', async () => {
        const deposits = await exchange.fetchDeposits();
        
        if (!Array.isArray(deposits)) {
            throw new Error('Deposits response is not an array');
        }
        
        log.dim(`  Returned ${deposits.length} deposits`);
        
        if (deposits.length > 0) {
            const deposit = deposits[0];
            log.dim(`  Sample deposit: ${deposit.amount} ${deposit.currency} - ${deposit.status}`);
        }
    });
    
    await runTest('fetchWithdrawals', async () => {
        const withdrawals = await exchange.fetchWithdrawals();
        
        if (!Array.isArray(withdrawals)) {
            throw new Error('Withdrawals response is not an array');
        }
        
        log.dim(`  Returned ${withdrawals.length} withdrawals`);
        
        if (withdrawals.length > 0) {
            const withdrawal = withdrawals[0];
            log.dim(`  Sample withdrawal: ${withdrawal.amount} ${withdrawal.currency} - ${withdrawal.status}`);
        }
    });
}

// Test withdraw method (simulation only)
async function testWithdraw(exchange) {
    log.subsection('Testing Withdraw Method');
    
    await runTest('withdraw (validation only)', async () => {
        // Don't actually execute a withdrawal, just test the method exists
        if (typeof exchange.withdraw !== 'function') {
            throw new Error('withdraw method not implemented');
        }
        
        log.dim('  withdraw method exists and is callable');
        log.warning('  Skipping actual withdrawal execution for safety');
        return 'skip';
    });
}

// Test error handling
async function testErrorHandling(exchange) {
    log.subsection('Testing Error Handling');
    
    await runTest('fetchOHLCV with invalid symbol', async () => {
        try {
            await exchange.fetchOHLCV('INVALID/PAIR', '1h');
            throw new Error('Expected error for invalid symbol');
        } catch (error) {
            if (error.message.includes('Expected error')) {
                throw error;
            }
            log.dim(`  Correctly threw error: ${error.constructor.name}`);
        }
    });
    
    await runTest('fetchOHLCV with invalid timeframe', async () => {
        try {
            await exchange.fetchOHLCV('SOL/USDC', '7m'); // Invalid timeframe
            throw new Error('Expected error for invalid timeframe');
        } catch (error) {
            if (error.message.includes('Expected error')) {
                throw error;
            }
            log.dim(`  Correctly threw error: ${error.constructor.name}`);
        }
    });
    
    await runTest('fetchOrder with invalid ID', async () => {
        try {
            await exchange.fetchOrder('invalid-order-id-12345');
            // Some exchanges might return null instead of throwing
            log.dim('  Returned gracefully (no error thrown)');
        } catch (error) {
            log.dim(`  Correctly threw error: ${error.constructor.name}`);
        }
    });
}

// Main test function
async function testBackpackPhase2() {
    try {
        log.section('Initializing Backpack Exchange');
        
        // Check for API keys
        const hasApiKeys = process.env.BACKPACK_API_KEY && process.env.BACKPACK_API_SECRET;
        
        if (!hasApiKeys) {
            log.warning('API keys not found - will test public methods only');
        } else {
            log.info('API keys loaded from environment');
        }
        
        // Initialize exchange
        const config = {
            enableRateLimit: true,
        };
        
        if (hasApiKeys) {
            config.apiKey = process.env.BACKPACK_API_KEY;
            config.secret = process.env.BACKPACK_API_SECRET;
        }
        
        const exchange = new ccxt.backpack(config);
        
        // Load markets
        log.info('Loading markets...');
        const markets = await exchange.loadMarkets();
        log.success(`Loaded ${Object.keys(markets).length} markets`);
        
        // Run tests
        log.section('Running Phase 2 Method Tests');
        
        // Public methods (always test)
        await testFetchOHLCV(exchange);
        await testFetchTickers(exchange);
        await testFetchCurrencies(exchange);
        
        // Private methods (only test with API keys)
        if (hasApiKeys) {
            await testOrderHistory(exchange);
            await testCapitalHistory(exchange);
            await testWithdraw(exchange);
        } else {
            log.warning('Skipping private method tests (no API keys)');
            stats.skipped += 6; // Count skipped private tests
        }
        
        // Error handling tests
        await testErrorHandling(exchange);
        
        // Summary
        log.section('Test Summary');
        log.info(`Total tests: ${stats.total}`);
        log.success(`Passed: ${stats.passed}`);
        if (stats.failed > 0) {
            log.error(`Failed: ${stats.failed}`);
        }
        if (stats.skipped > 0) {
            log.warning(`Skipped: ${stats.skipped}`);
        }
        
        const successRate = ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(1);
        log.info(`Success rate: ${successRate}%`);
        
        if (stats.failed === 0) {
            log.section('All Phase 2 Tests Completed Successfully! 🎉');
        } else {
            log.section('Some Tests Failed - Review Above');
            process.exit(1);
        }
        
    } catch (error) {
        log.error(`Test suite failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the test suite
console.log(`${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║     Backpack Phase 2 Test Suite            ║${colors.reset}`);
console.log(`${colors.magenta}║     Testing All New Methods                ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

testBackpackPhase2().then(() => {
    console.log(`\n${colors.green}Test suite completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite crashed:${colors.reset}`, error);
    process.exit(1);
});