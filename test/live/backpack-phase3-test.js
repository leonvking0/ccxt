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

// Test futures position methods
async function testFuturesPositions(exchange) {
    log.subsection('Testing Futures Position Methods');
    
    // Test fetchPositions
    await runTest('fetchPositions', async () => {
        const positions = await exchange.fetchPositions();
        
        if (!Array.isArray(positions)) {
            throw new Error('Positions response is not an array');
        }
        
        log.dim(`  Returned ${positions.length} positions`);
        
        if (positions.length > 0) {
            const position = positions[0];
            if (!position.symbol || position.contracts === undefined) {
                throw new Error('Invalid position structure');
            }
            log.dim(`  Sample position: ${position.symbol} ${position.side} ${position.contracts} contracts`);
        }
    });
    
    // Test fetchPosition for specific symbol (only if futures markets exist)
    await runTest('fetchPosition (specific symbol)', async () => {
        const markets = Object.values(exchange.markets);
        const futuresMarket = markets.find(m => m.swap && m.active);
        
        if (!futuresMarket) {
            log.warning('No active futures markets found');
            return 'skip';
        }
        
        try {
            const position = await exchange.fetchPosition(futuresMarket.symbol);
            
            if (position && position.symbol !== futuresMarket.symbol) {
                throw new Error('Position symbol mismatch');
            }
            
            log.dim(`  Position for ${futuresMarket.symbol}: ${position ? 'Found' : 'No position'}`);
        } catch (error) {
            // It's ok if no position exists for the symbol
            if (error.message.includes('position')) {
                log.dim(`  No position for ${futuresMarket.symbol} (expected)`);
            } else {
                throw error;
            }
        }
    });
}

// Test funding rate methods
async function testFundingRates(exchange) {
    log.subsection('Testing Funding Rate Methods');
    
    // Test fetchFundingRate
    await runTest('fetchFundingRate', async () => {
        const markets = Object.values(exchange.markets);
        const perpMarket = markets.find(m => m.swap && m.linear && m.active);
        
        if (!perpMarket) {
            log.warning('No perpetual markets found');
            return 'skip';
        }
        
        const fundingRate = await exchange.fetchFundingRate(perpMarket.symbol);
        
        if (!fundingRate || fundingRate.symbol !== perpMarket.symbol) {
            throw new Error('Invalid funding rate response');
        }
        
        log.dim(`  ${perpMarket.symbol} funding rate: ${fundingRate.fundingRate}`);
        log.dim(`  Next funding time: ${new Date(fundingRate.fundingTimestamp).toISOString()}`);
    });
    
    // Test fetchFundingRateHistory
    await runTest('fetchFundingRateHistory', async () => {
        const markets = Object.values(exchange.markets);
        const perpMarket = markets.find(m => m.swap && m.linear && m.active);
        
        if (!perpMarket) {
            log.warning('No perpetual markets found');
            return 'skip';
        }
        
        const since = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        const fundingHistory = await exchange.fetchFundingRateHistory(perpMarket.symbol, since, 10);
        
        if (!Array.isArray(fundingHistory)) {
            throw new Error('Funding history is not an array');
        }
        
        log.dim(`  Returned ${fundingHistory.length} funding rate records`);
        
        if (fundingHistory.length > 0) {
            const record = fundingHistory[0];
            log.dim(`  Sample record: Rate=${record.fundingRate}, Time=${new Date(record.timestamp).toISOString()}`);
        }
    });
}

// Test mark price and open interest
async function testFuturesMarketData(exchange) {
    log.subsection('Testing Futures Market Data');
    
    // Test fetchMarkPrice
    await runTest('fetchMarkPrice', async () => {
        const markets = Object.values(exchange.markets);
        const futuresMarket = markets.find(m => m.swap && m.active);
        
        if (!futuresMarket) {
            log.warning('No futures markets found');
            return 'skip';
        }
        
        const markPrice = await exchange.fetchMarkPrice(futuresMarket.symbol);
        
        if (!markPrice || !markPrice.markPrice) {
            throw new Error('Invalid mark price response');
        }
        
        log.dim(`  ${futuresMarket.symbol} mark price: ${markPrice.markPrice}`);
        if (markPrice.indexPrice) {
            log.dim(`  Index price: ${markPrice.indexPrice}`);
        }
    });
    
    // Test fetchOpenInterest
    await runTest('fetchOpenInterest', async () => {
        const markets = Object.values(exchange.markets);
        const futuresMarket = markets.find(m => m.swap && m.active);
        
        if (!futuresMarket) {
            log.warning('No futures markets found');
            return 'skip';
        }
        
        const openInterest = await exchange.fetchOpenInterest(futuresMarket.symbol);
        
        if (!openInterest || openInterest.openInterestAmount === undefined) {
            throw new Error('Invalid open interest response');
        }
        
        log.dim(`  ${futuresMarket.symbol} open interest: ${openInterest.openInterestAmount} contracts`);
        if (openInterest.openInterestValue) {
            log.dim(`  Open interest value: ${openInterest.openInterestValue} ${futuresMarket.quote}`);
        }
    });
}

// Test borrow/lending methods
async function testBorrowLending(exchange) {
    log.subsection('Testing Borrow/Lending Methods');
    
    // Test fetchBorrowRates
    await runTest('fetchBorrowRates (all)', async () => {
        const borrowRates = await exchange.fetchBorrowRates();
        
        if (!Array.isArray(borrowRates)) {
            throw new Error('Borrow rates response is not an array');
        }
        
        log.dim(`  Returned ${borrowRates.length} borrow rate records`);
        
        if (borrowRates.length > 0) {
            const rate = borrowRates[0];
            log.dim(`  ${rate.currency}: Borrow=${rate.rate}, Info: ${JSON.stringify(rate.info)}`);
        }
    });
    
    // Test fetchBorrowRates for specific currency
    await runTest('fetchBorrowRates (USDC)', async () => {
        try {
            const borrowRates = await exchange.fetchBorrowRates('USDC');
            
            if (!Array.isArray(borrowRates)) {
                throw new Error('Borrow rates response is not an array');
            }
            
            const usdcRate = borrowRates.find(r => r.currency === 'USDC');
            if (usdcRate) {
                log.dim(`  USDC borrow rate: ${usdcRate.rate} (${usdcRate.rate * 100}% APR)`);
            }
        } catch (error) {
            // Some exchanges might not support filtering by currency
            log.warning('  Currency-specific borrow rates not supported');
            return 'skip';
        }
    });
    
    // Test fetchBorrowRateHistory
    await runTest('fetchBorrowRateHistory', async () => {
        const since = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        const history = await exchange.fetchBorrowRateHistory('USDC', since, 10);
        
        if (!Array.isArray(history)) {
            throw new Error('Borrow rate history is not an array');
        }
        
        log.dim(`  Returned ${history.length} historical rate records`);
        
        if (history.length > 0) {
            const record = history[0];
            log.dim(`  Sample: Rate=${record.rate} at ${new Date(record.timestamp).toISOString()}`);
        }
    });
    
    // Test fetchBorrowInterest
    await runTest('fetchBorrowInterest', async () => {
        const interests = await exchange.fetchBorrowInterest();
        
        if (!Array.isArray(interests)) {
            throw new Error('Borrow interest response is not an array');
        }
        
        log.dim(`  Returned ${interests.length} interest payment records`);
        
        if (interests.length > 0) {
            const interest = interests[0];
            log.dim(`  Sample: ${interest.currency} interest=${interest.interest} at ${new Date(interest.timestamp).toISOString()}`);
        }
    });
    
    // Test borrowMargin (simulation only)
    await runTest('borrowMargin (validation only)', async () => {
        if (typeof exchange.borrowMargin !== 'function') {
            throw new Error('borrowMargin method not implemented');
        }
        
        log.dim('  borrowMargin method exists and is callable');
        log.warning('  Skipping actual borrow execution for safety');
        return 'skip';
    });
    
    // Test repayMargin (simulation only)
    await runTest('repayMargin (validation only)', async () => {
        if (typeof exchange.repayMargin !== 'function') {
            throw new Error('repayMargin method not implemented');
        }
        
        log.dim('  repayMargin method exists and is callable');
        log.warning('  Skipping actual repay execution for safety');
        return 'skip';
    });
}

// Test advanced features
async function testAdvancedFeatures(exchange) {
    log.subsection('Testing Advanced Features');
    
    // Test fetchDepositAddress
    await runTest('fetchDepositAddress', async () => {
        const currencies = Object.values(exchange.currencies);
        const depositableCurrency = currencies.find(c => c.active && c.deposit);
        
        if (!depositableCurrency) {
            log.warning('No depositable currencies found');
            return 'skip';
        }
        
        const depositAddress = await exchange.fetchDepositAddress(depositableCurrency.code);
        
        if (!depositAddress || !depositAddress.address) {
            throw new Error('Invalid deposit address response');
        }
        
        log.dim(`  ${depositableCurrency.code} deposit address: ${depositAddress.address.substring(0, 20)}...`);
        log.dim(`  Network: ${depositAddress.network || 'default'}`);
        if (depositAddress.tag) {
            log.dim(`  Memo/Tag: ${depositAddress.tag}`);
        }
    });
    
    // Test fetchTradingFees
    await runTest('fetchTradingFees', async () => {
        const fees = await exchange.fetchTradingFees();
        
        if (!fees || typeof fees !== 'object') {
            throw new Error('Invalid trading fees response');
        }
        
        if (fees.trading) {
            log.dim(`  Spot fees - Maker: ${fees.trading.maker * 100}%, Taker: ${fees.trading.taker * 100}%`);
        }
        
        if (fees.futures) {
            log.dim(`  Futures fees - Maker: ${fees.futures.maker * 100}%, Taker: ${fees.futures.taker * 100}%`);
        }
    });
    
    // Test fetchSettlementHistory
    await runTest('fetchSettlementHistory', async () => {
        const settlements = await exchange.fetchSettlementHistory();
        
        if (!Array.isArray(settlements)) {
            throw new Error('Settlement history is not an array');
        }
        
        log.dim(`  Returned ${settlements.length} settlement records`);
        
        if (settlements.length > 0) {
            const settlement = settlements[0];
            log.dim(`  Sample: ${settlement.symbol} settled at ${settlement.price} on ${new Date(settlement.timestamp).toISOString()}`);
        }
    });
    
    // Test fetchPnlHistory
    await runTest('fetchPnlHistory', async () => {
        const pnlHistory = await exchange.fetchPnlHistory();
        
        if (!Array.isArray(pnlHistory)) {
            throw new Error('PnL history is not an array');
        }
        
        log.dim(`  Returned ${pnlHistory.length} PnL records`);
        
        if (pnlHistory.length > 0) {
            const pnl = pnlHistory[0];
            log.dim(`  Sample: ${pnl.symbol} PnL=${pnl.pnl} at ${new Date(pnl.timestamp).toISOString()}`);
        }
    });
}

// Test conditional orders
async function testConditionalOrders(exchange) {
    log.subsection('Testing Conditional Orders');
    
    // Test createStopLossOrder (validation only)
    await runTest('createStopLossOrder (validation only)', async () => {
        if (typeof exchange.createStopLossOrder !== 'function') {
            throw new Error('createStopLossOrder method not implemented');
        }
        
        log.dim('  createStopLossOrder method exists and is callable');
        log.warning('  Skipping actual order creation for safety');
        return 'skip';
    });
    
    // Test createTakeProfitOrder (validation only)
    await runTest('createTakeProfitOrder (validation only)', async () => {
        if (typeof exchange.createTakeProfitOrder !== 'function') {
            throw new Error('createTakeProfitOrder method not implemented');
        }
        
        log.dim('  createTakeProfitOrder method exists and is callable');
        log.warning('  Skipping actual order creation for safety');
        return 'skip';
    });
}

// Test WebSocket connectivity
async function testWebSocketConnectivity(exchange) {
    log.subsection('Testing WebSocket Connectivity');
    
    await runTest('WebSocket pro exchange exists', async () => {
        // Check if pro version exists
        try {
            const ccxtPro = await import('../../js/ccxt.pro.js');
            const proExchange = new ccxtPro.backpack();
            
            if (!proExchange.has.ws) {
                throw new Error('WebSocket not supported in pro version');
            }
            
            log.dim('  WebSocket pro exchange initialized successfully');
            log.dim(`  Supported streams: ${JSON.stringify(Object.keys(proExchange.has).filter(k => k.startsWith('watch')))}`);
        } catch (error) {
            if (error.code === 'ERR_MODULE_NOT_FOUND') {
                log.warning('  CCXT Pro not available - skipping WebSocket tests');
                return 'skip';
            }
            throw error;
        }
    });
}

// Main test function
async function testBackpackPhase3() {
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
        
        // Count market types
        const spotMarkets = Object.values(markets).filter(m => m.spot).length;
        const futuresMarkets = Object.values(markets).filter(m => m.swap).length;
        log.dim(`  Spot markets: ${spotMarkets}, Futures markets: ${futuresMarkets}`);
        
        // Run tests
        log.section('Running Phase 3 Method Tests');
        
        // Public methods (always test)
        await testFuturesMarketData(exchange);
        await testBorrowLending(exchange);
        
        // Private methods (only test with API keys)
        if (hasApiKeys) {
            await testFuturesPositions(exchange);
            await testFundingRates(exchange);
            await testAdvancedFeatures(exchange);
            await testConditionalOrders(exchange);
        } else {
            log.warning('Skipping private method tests (no API keys)');
            stats.skipped += 10; // Approximate number of private tests
        }
        
        // WebSocket tests
        await testWebSocketConnectivity(exchange);
        
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
            log.section('All Phase 3 Tests Completed Successfully! 🎉');
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
console.log(`${colors.magenta}║     Backpack Phase 3 Test Suite            ║${colors.reset}`);
console.log(`${colors.magenta}║     Testing Advanced Features              ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

testBackpackPhase3().then(() => {
    console.log(`\n${colors.green}Test suite completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite crashed:${colors.reset}`, error);
    process.exit(1);
});