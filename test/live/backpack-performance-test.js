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

// Performance metrics
const metrics = {
    apiCalls: [],
    errors: [],
    rateLimits: [],
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

// Measure API call performance
async function measureApiCall(exchange, method, ...args) {
    const start = Date.now();
    try {
        const result = await exchange[method](...args);
        const duration = Date.now() - start;
        metrics.apiCalls.push({ method, duration, success: true });
        return { result, duration };
    } catch (error) {
        const duration = Date.now() - start;
        metrics.apiCalls.push({ method, duration, success: false, error: error.constructor.name });
        throw error;
    }
}

// Test rate limiting
async function testRateLimiting(exchange) {
    log.subsection('Testing Rate Limiting');
    
    await runTest('Burst requests handling', async () => {
        const symbol = 'SOL/USDC';
        const requests = 10;
        const promises = [];
        
        log.dim(`  Sending ${requests} concurrent requests...`);
        
        for (let i = 0; i < requests; i++) {
            promises.push(measureApiCall(exchange, 'fetchTicker', symbol));
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        log.dim(`  Successful: ${successful}, Failed: ${failed}`);
        
        // Check for rate limit errors
        const rateLimitErrors = results.filter(r => 
            r.status === 'rejected' && 
            r.reason.constructor.name === 'RateLimitExceeded'
        ).length;
        
        if (rateLimitErrors > 0) {
            log.dim(`  Rate limit errors: ${rateLimitErrors} (expected behavior)`);
            metrics.rateLimits.push({ requests, rateLimitErrors });
        }
        
        // At least some requests should succeed
        if (successful === 0) {
            throw new Error('All requests failed');
        }
    });
    
    await runTest('Rate limit recovery', async () => {
        log.dim('  Testing recovery after rate limit...');
        
        // Wait a bit for rate limit to reset
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const { duration } = await measureApiCall(exchange, 'fetchTicker', 'SOL/USDC');
            log.dim(`  Recovery successful, response time: ${duration}ms`);
        } catch (error) {
            if (error.constructor.name === 'RateLimitExceeded') {
                throw new Error('Still rate limited after wait period');
            }
            throw error;
        }
    });
}

// Test error handling
async function testErrorHandling(exchange) {
    log.subsection('Testing Error Handling');
    
    // Test invalid symbol
    await runTest('Invalid symbol error', async () => {
        try {
            await exchange.fetchTicker('INVALID/PAIR');
            throw new Error('Expected error for invalid symbol');
        } catch (error) {
            if (error.message.includes('Expected error')) {
                throw error;
            }
            
            metrics.errors.push({ 
                test: 'invalid_symbol', 
                errorType: error.constructor.name,
                handled: true 
            });
            
            log.dim(`  Correctly threw ${error.constructor.name}: ${error.message}`);
        }
    });
    
    // Test invalid order parameters
    await runTest('Invalid order parameters', async () => {
        try {
            await exchange.createOrder('SOL/USDC', 'invalid_type', 'buy', 1, 100);
            throw new Error('Expected error for invalid order type');
        } catch (error) {
            if (error.message.includes('Expected error')) {
                throw error;
            }
            
            metrics.errors.push({ 
                test: 'invalid_order_type', 
                errorType: error.constructor.name,
                handled: true 
            });
            
            log.dim(`  Correctly threw ${error.constructor.name}`);
        }
    });
    
    // Test non-existent order
    await runTest('Non-existent order fetch', async () => {
        try {
            await exchange.fetchOrder('99999999999999999999');
            // Some exchanges return null instead of throwing
            log.dim('  Returned null/undefined for non-existent order');
        } catch (error) {
            metrics.errors.push({ 
                test: 'non_existent_order', 
                errorType: error.constructor.name,
                handled: true 
            });
            
            log.dim(`  Correctly threw ${error.constructor.name}`);
        }
    });
    
    // Test futures-specific errors
    await runTest('Futures method on spot symbol', async () => {
        try {
            await exchange.fetchPosition('SOL/USDC'); // Spot market
            log.dim('  Returned empty/null position for spot market');
        } catch (error) {
            if (error.message.includes('not a futures')) {
                log.dim('  Correctly rejected spot symbol for futures method');
            } else {
                throw error;
            }
        }
    });
    
    // Test insufficient balance (if authenticated)
    if (exchange.apiKey) {
        await runTest('Insufficient balance error', async () => {
            try {
                // Try to place a very large order
                await exchange.createOrder('SOL/USDC', 'limit', 'buy', 999999, 100);
                throw new Error('Expected insufficient balance error');
            } catch (error) {
                if (error.message.includes('Expected insufficient')) {
                    throw error;
                }
                
                if (error.constructor.name === 'InsufficientFunds') {
                    log.dim('  Correctly threw InsufficientFunds error');
                } else {
                    log.dim(`  Threw ${error.constructor.name}: ${error.message}`);
                }
                
                metrics.errors.push({ 
                    test: 'insufficient_balance', 
                    errorType: error.constructor.name,
                    handled: true 
                });
            }
        });
    }
}

// Test performance benchmarks
async function testPerformanceBenchmarks(exchange) {
    log.subsection('Testing Performance Benchmarks');
    
    // Test single endpoint performance
    await runTest('Single endpoint response times', async () => {
        const endpoints = [
            { method: 'fetchTicker', args: ['SOL/USDC'] },
            { method: 'fetchOrderBook', args: ['SOL/USDC'] },
            { method: 'fetchTrades', args: ['SOL/USDC'] },
            { method: 'fetchOHLCV', args: ['SOL/USDC', '1h'] },
        ];
        
        for (const endpoint of endpoints) {
            try {
                const { duration } = await measureApiCall(exchange, endpoint.method, ...endpoint.args);
                log.dim(`  ${endpoint.method}: ${duration}ms`);
                
                // Warn if response time is slow
                if (duration > 2000) {
                    log.warning(`  ${endpoint.method} is slow (>2s)`);
                    stats.warnings++;
                }
            } catch (error) {
                log.error(`  ${endpoint.method} failed: ${error.message}`);
            }
        }
    });
    
    // Test parallel requests performance
    await runTest('Parallel requests performance', async () => {
        const symbols = ['SOL/USDC', 'BTC/USDC', 'ETH/USDC'];
        const start = Date.now();
        
        log.dim('  Fetching tickers for multiple symbols in parallel...');
        
        const promises = symbols.map(symbol => 
            measureApiCall(exchange, 'fetchTicker', symbol)
        );
        
        const results = await Promise.allSettled(promises);
        const totalDuration = Date.now() - start;
        
        const successful = results.filter(r => r.status === 'fulfilled');
        log.dim(`  Completed ${successful.length}/${symbols.length} requests in ${totalDuration}ms`);
        
        // Calculate average response time
        const avgDuration = successful.reduce((sum, r) => sum + r.value.duration, 0) / successful.length;
        log.dim(`  Average response time: ${avgDuration.toFixed(0)}ms`);
    });
    
    // Test large data handling
    await runTest('Large dataset handling', async () => {
        // Test fetching maximum allowed limits
        const tests = [
            { method: 'fetchTrades', args: ['SOL/USDC', null, 1000], name: '1000 trades' },
            { method: 'fetchOHLCV', args: ['SOL/USDC', '1m', Date.now() - 24*60*60*1000, 1440], name: '1440 candles' },
        ];
        
        for (const test of tests) {
            try {
                const start = Date.now();
                const result = await exchange[test.method](...test.args);
                const duration = Date.now() - start;
                
                log.dim(`  ${test.name}: ${Array.isArray(result) ? result.length : 'N/A'} items in ${duration}ms`);
                
                if (duration > 5000) {
                    log.warning(`  ${test.name} is very slow (>5s)`);
                    stats.warnings++;
                }
            } catch (error) {
                log.dim(`  ${test.name} not supported or failed`);
            }
        }
    });
    
    // Test authenticated endpoints performance (if API keys available)
    if (exchange.apiKey) {
        await runTest('Authenticated endpoints performance', async () => {
            const authEndpoints = [
                { method: 'fetchBalance', args: [] },
                { method: 'fetchOpenOrders', args: [] },
                { method: 'fetchMyTrades', args: [null, null, 10] },
                { method: 'fetchPositions', args: [] },
            ];
            
            for (const endpoint of authEndpoints) {
                try {
                    const { duration } = await measureApiCall(exchange, endpoint.method, ...endpoint.args);
                    log.dim(`  ${endpoint.method}: ${duration}ms`);
                } catch (error) {
                    log.dim(`  ${endpoint.method} failed or not available`);
                }
            }
        });
    }
}

// Test recovery and resilience
async function testRecoveryResilience(exchange) {
    log.subsection('Testing Recovery and Resilience');
    
    await runTest('Connection recovery', async () => {
        // Simulate network issues by making rapid requests
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                exchange.fetchTicker('SOL/USDC').catch(e => ({ error: e }))
            );
        }
        
        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error).length;
        
        log.dim(`  Handled ${errors} errors out of 5 requests`);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await exchange.fetchTicker('SOL/USDC');
        if (!retryResult) {
            throw new Error('Recovery failed');
        }
        
        log.dim('  Successfully recovered after errors');
    });
    
    await runTest('Nonce handling', async () => {
        if (!exchange.apiKey) {
            return 'skip';
        }
        
        // Make several authenticated requests in quick succession
        const requests = [];
        for (let i = 0; i < 3; i++) {
            requests.push(exchange.fetchBalance());
        }
        
        try {
            await Promise.all(requests);
            log.dim('  Nonce handling successful for concurrent requests');
        } catch (error) {
            if (error.constructor.name === 'InvalidNonce') {
                throw new Error('Nonce handling failed');
            }
            throw error;
        }
    });
}

// Generate performance report
function generatePerformanceReport() {
    log.section('Performance Report');
    
    // API call statistics
    if (metrics.apiCalls.length > 0) {
        const successful = metrics.apiCalls.filter(c => c.success);
        const failed = metrics.apiCalls.filter(c => !c.success);
        
        log.info('API Call Statistics:');
        log.dim(`  Total calls: ${metrics.apiCalls.length}`);
        log.dim(`  Successful: ${successful.length}`);
        log.dim(`  Failed: ${failed.length}`);
        
        if (successful.length > 0) {
            const avgDuration = successful.reduce((sum, c) => sum + c.duration, 0) / successful.length;
            const minDuration = Math.min(...successful.map(c => c.duration));
            const maxDuration = Math.max(...successful.map(c => c.duration));
            
            log.info('Response Times:');
            log.dim(`  Average: ${avgDuration.toFixed(0)}ms`);
            log.dim(`  Min: ${minDuration}ms`);
            log.dim(`  Max: ${maxDuration}ms`);
        }
    }
    
    // Error statistics
    if (metrics.errors.length > 0) {
        log.info('Error Handling:');
        const errorTypes = {};
        metrics.errors.forEach(e => {
            errorTypes[e.errorType] = (errorTypes[e.errorType] || 0) + 1;
        });
        
        Object.entries(errorTypes).forEach(([type, count]) => {
            log.dim(`  ${type}: ${count} occurrences`);
        });
    }
    
    // Rate limiting
    if (metrics.rateLimits.length > 0) {
        log.info('Rate Limiting:');
        metrics.rateLimits.forEach(rl => {
            log.dim(`  ${rl.rateLimitErrors}/${rl.requests} requests rate limited`);
        });
    }
}

// Main test function
async function testBackpackPerformance() {
    try {
        log.section('Initializing Backpack Exchange');
        
        // Check for API keys
        const hasApiKeys = process.env.BACKPACK_API_KEY && process.env.BACKPACK_API_SECRET;
        
        if (!hasApiKeys) {
            log.warning('API keys not found - some tests will be skipped');
        } else {
            log.info('API keys loaded from environment');
        }
        
        // Initialize exchange
        const config = {
            enableRateLimit: true,
            rateLimit: 100, // Lower rate limit for testing
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
        log.section('Running Performance & Error Tests');
        
        await testRateLimiting(exchange);
        await testErrorHandling(exchange);
        await testPerformanceBenchmarks(exchange);
        await testRecoveryResilience(exchange);
        
        // Generate report
        generatePerformanceReport();
        
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
        if (stats.warnings > 0) {
            log.warning(`Warnings: ${stats.warnings}`);
        }
        
        const successRate = ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(1);
        log.info(`Success rate: ${successRate}%`);
        
        if (stats.failed === 0) {
            log.section('All Performance Tests Completed Successfully! 🎉');
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
console.log(`${colors.magenta}║  Backpack Performance & Error Test Suite   ║${colors.reset}`);
console.log(`${colors.magenta}║     Testing Reliability & Speed            ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

testBackpackPerformance().then(() => {
    console.log(`\n${colors.green}Test suite completed!${colors.reset}`);
    process.exit(0);
}).catch((error) => {
    console.error(`\n${colors.red}Test suite crashed:${colors.reset}`, error);
    process.exit(1);
});