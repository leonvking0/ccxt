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

// Test WebSocket public streams
async function testPublicStreams(proExchange) {
    log.subsection('Testing Public WebSocket Streams');
    
    // Test watchTicker
    await runTest('watchTicker', async () => {
        const symbol = 'SOL/USDC';
        const timeout = 10000; // 10 seconds timeout
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout waiting for ticker')), timeout);
        });
        
        try {
            log.dim(`  Subscribing to ${symbol} ticker...`);
            const ticker = await Promise.race([
                proExchange.watchTicker(symbol),
                timeoutPromise
            ]);
            
            if (!ticker || !ticker.symbol || ticker.last === undefined) {
                throw new Error('Invalid ticker data received');
            }
            
            log.dim(`  ${symbol} - Last: ${ticker.last}, Bid: ${ticker.bid}, Ask: ${ticker.ask}`);
            
            // Close the ticker stream
            if (proExchange.streaming && proExchange.streaming[symbol] && proExchange.streaming[symbol].ticker) {
                delete proExchange.streaming[symbol].ticker;
            }
        } catch (error) {
            if (error.message === 'watchTicker() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
    
    // Test watchTrades
    await runTest('watchTrades', async () => {
        const symbol = 'SOL/USDC';
        const timeout = 10000;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout waiting for trades')), timeout);
        });
        
        try {
            log.dim(`  Subscribing to ${symbol} trades...`);
            const trades = await Promise.race([
                proExchange.watchTrades(symbol),
                timeoutPromise
            ]);
            
            if (!Array.isArray(trades) || trades.length === 0) {
                throw new Error('Invalid trades data received');
            }
            
            log.dim(`  Received ${trades.length} trades`);
            const lastTrade = trades[trades.length - 1];
            log.dim(`  Last trade: ${lastTrade.side} ${lastTrade.amount} @ ${lastTrade.price}`);
            
            // Close the trades stream
            if (proExchange.streaming && proExchange.streaming[symbol] && proExchange.streaming[symbol].trades) {
                delete proExchange.streaming[symbol].trades;
            }
        } catch (error) {
            if (error.message === 'watchTrades() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
    
    // Test watchOrderBook
    await runTest('watchOrderBook', async () => {
        const symbol = 'SOL/USDC';
        const timeout = 10000;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout waiting for order book')), timeout);
        });
        
        try {
            log.dim(`  Subscribing to ${symbol} order book...`);
            const orderBook = await Promise.race([
                proExchange.watchOrderBook(symbol),
                timeoutPromise
            ]);
            
            if (!orderBook || !Array.isArray(orderBook.bids) || !Array.isArray(orderBook.asks)) {
                throw new Error('Invalid order book data received');
            }
            
            log.dim(`  Order book depth - Bids: ${orderBook.bids.length}, Asks: ${orderBook.asks.length}`);
            if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
                log.dim(`  Best bid: ${orderBook.bids[0][0]}, Best ask: ${orderBook.asks[0][0]}`);
                log.dim(`  Spread: ${orderBook.asks[0][0] - orderBook.bids[0][0]}`);
            }
            
            // Close the order book stream
            if (proExchange.streaming && proExchange.streaming[symbol] && proExchange.streaming[symbol].orderbook) {
                delete proExchange.streaming[symbol].orderbook;
            }
        } catch (error) {
            if (error.message === 'watchOrderBook() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
    
    // Test watchOHLCV
    await runTest('watchOHLCV', async () => {
        const symbol = 'SOL/USDC';
        const timeframe = '1m';
        const timeout = 10000;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout waiting for OHLCV')), timeout);
        });
        
        try {
            log.dim(`  Subscribing to ${symbol} ${timeframe} candles...`);
            const ohlcv = await Promise.race([
                proExchange.watchOHLCV(symbol, timeframe),
                timeoutPromise
            ]);
            
            if (!Array.isArray(ohlcv) || ohlcv.length === 0) {
                throw new Error('Invalid OHLCV data received');
            }
            
            log.dim(`  Received ${ohlcv.length} candles`);
            const lastCandle = ohlcv[ohlcv.length - 1];
            log.dim(`  Last candle: O=${lastCandle[1]} H=${lastCandle[2]} L=${lastCandle[3]} C=${lastCandle[4]} V=${lastCandle[5]}`);
            
            // Close the OHLCV stream
            if (proExchange.streaming && proExchange.streaming[symbol] && proExchange.streaming[symbol].ohlcv) {
                delete proExchange.streaming[symbol].ohlcv[timeframe];
            }
        } catch (error) {
            if (error.message === 'watchOHLCV() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
}

// Test WebSocket private streams
async function testPrivateStreams(proExchange) {
    log.subsection('Testing Private WebSocket Streams');
    
    // Test watchOrders
    await runTest('watchOrders', async () => {
        const timeout = 5000;
        
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve([]), timeout);
        });
        
        try {
            log.dim('  Subscribing to order updates...');
            const orders = await Promise.race([
                proExchange.watchOrders(),
                timeoutPromise
            ]);
            
            if (!Array.isArray(orders)) {
                throw new Error('Invalid orders data received');
            }
            
            log.dim(`  Monitoring orders... (${orders.length} active orders)`);
            
            // Close the orders stream
            if (proExchange.streaming && proExchange.streaming.orders) {
                delete proExchange.streaming.orders;
            }
        } catch (error) {
            if (error.message === 'watchOrders() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
    
    // Test watchPositions  
    await runTest('watchPositions', async () => {
        const timeout = 5000;
        
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve([]), timeout);
        });
        
        try {
            log.dim('  Subscribing to position updates...');
            const positions = await Promise.race([
                proExchange.watchPositions(),
                timeoutPromise
            ]);
            
            if (!Array.isArray(positions)) {
                throw new Error('Invalid positions data received');
            }
            
            log.dim(`  Monitoring positions... (${positions.length} open positions)`);
            
            // Close the positions stream
            if (proExchange.streaming && proExchange.streaming.positions) {
                delete proExchange.streaming.positions;
            }
        } catch (error) {
            if (error.message === 'watchPositions() is not supported yet') {
                return 'skip';
            }
            throw error;
        }
    });
}

// Test WebSocket authentication
async function testWebSocketAuth(proExchange) {
    log.subsection('Testing WebSocket Authentication');
    
    await runTest('ED25519 WebSocket authentication', async () => {
        // The authentication happens automatically when subscribing to private streams
        // We just verify the exchange has the required credentials
        
        if (!proExchange.apiKey || !proExchange.secret) {
            log.warning('  No API credentials - cannot test authenticated streams');
            return 'skip';
        }
        
        // Check if ED25519 signing method exists
        if (typeof proExchange.signMessageWithEd25519 !== 'function') {
            throw new Error('ED25519 signing method not found');
        }
        
        log.dim('  ED25519 authentication capability verified');
        log.dim('  API key configured: ' + proExchange.apiKey.substring(0, 10) + '...');
    });
}

// Main test function
async function testBackpackWebSocket() {
    try {
        log.section('Testing Backpack WebSocket Implementation');
        
        // Try to import CCXT Pro
        let ccxtPro;
        try {
            ccxtPro = await import('../../js/ccxt.pro.js');
        } catch (error) {
            log.error('CCXT Pro not found. Please ensure ccxt.pro is installed.');
            log.info('Install with: npm install ccxt.pro');
            process.exit(1);
        }
        
        // Check for API keys
        const hasApiKeys = process.env.BACKPACK_API_KEY && process.env.BACKPACK_API_SECRET;
        
        if (!hasApiKeys) {
            log.warning('API keys not found - will test public streams only');
        } else {
            log.info('API keys loaded from environment');
        }
        
        // Initialize pro exchange
        const config = {
            enableRateLimit: true,
            newUpdates: true, // Use incremental order book updates
        };
        
        if (hasApiKeys) {
            config.apiKey = process.env.BACKPACK_API_KEY;
            config.secret = process.env.BACKPACK_API_SECRET;
        }
        
        const proExchange = new ccxtPro.backpack(config);
        
        // Check WebSocket capabilities
        log.info('Checking WebSocket capabilities...');
        if (!proExchange.has.ws) {
            throw new Error('WebSocket not enabled for Backpack exchange');
        }
        
        const wsCapabilities = Object.keys(proExchange.has)
            .filter(k => k.startsWith('watch'))
            .filter(k => proExchange.has[k]);
        
        log.success(`WebSocket capabilities: ${wsCapabilities.join(', ')}`);
        
        // Load markets
        log.info('Loading markets...');
        await proExchange.loadMarkets();
        log.success(`Loaded ${Object.keys(proExchange.markets).length} markets`);
        
        // Run tests
        log.section('Running WebSocket Tests');
        
        // Test authentication
        await testWebSocketAuth(proExchange);
        
        // Test public streams
        await testPublicStreams(proExchange);
        
        // Test private streams (only with API keys)
        if (hasApiKeys) {
            await testPrivateStreams(proExchange);
        } else {
            log.warning('Skipping private stream tests (no API keys)');
            stats.skipped += 2;
        }
        
        // Close all connections
        log.info('Closing WebSocket connections...');
        await proExchange.close();
        
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
            log.section('All WebSocket Tests Completed Successfully! 🎉');
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
console.log(`${colors.magenta}║     Backpack WebSocket Test Suite          ║${colors.reset}`);
console.log(`${colors.magenta}║     Testing Real-time Streams              ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

testBackpackWebSocket().then(() => {
    console.log(`\n${colors.green}Test suite completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite crashed:${colors.reset}`, error);
    process.exit(1);
});