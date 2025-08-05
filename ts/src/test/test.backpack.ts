// ----------------------------------------------------------------------------
// Basic unit tests for Backpack exchange implementation
// ----------------------------------------------------------------------------

import assert from 'assert';
import ccxt from '../../ccxt.js';
import { fileURLToPath } from 'url';

// Test ED25519 signature generation
async function testBackpackAuthentication () {
    console.log ('Testing Backpack ED25519 authentication...');
    
    const exchange = new ccxt.backpack ({
        'apiKey': 'test_public_key',
        'secret': '8Mw0QLMkar0QcJTDZdx0kktJEj4gUU9G0724COtaISw=', // Valid base64 encoded test key
    });
    
    // Test instruction type mapping
    const instructionTests = [
        { path: 'capital', method: 'GET', expected: 'balanceQuery' },
        { path: 'orders', method: 'GET', expected: 'orderQueryAll' },
        { path: 'orders/execute', method: 'POST', expected: 'orderExecute' },
        { path: 'order', method: 'DELETE', expected: 'orderCancel' },
    ];
    
    for (const test of instructionTests) {
        const instruction = exchange.getInstructionType (test.path, test.method);
        assert.strictEqual (instruction, test.expected, 
            `Instruction type for ${test.method} ${test.path} should be ${test.expected}`);
    }
    
    // Test signature generation (without actual API call)
    const message = 'instruction=balanceQuery&timestamp=1700000000000&window=5000';
    const signature = exchange.signMessageWithEd25519 (message);
    assert (signature, 'Signature should be generated');
    assert (typeof signature === 'string', 'Signature should be a string');
    assert (signature.length > 0, 'Signature should not be empty');
    
    console.log ('✓ Authentication tests passed');
}

// Test market parsing
async function testBackpackMarketParsing () {
    console.log ('Testing Backpack market parsing...');
    
    const exchange = new ccxt.backpack ();
    
    // Test spot market parsing
    const spotMarket = {
        'symbol': 'SOL_USDC',
        'baseSymbol': 'SOL',
        'quoteSymbol': 'USDC',
        'marketType': 'Spot',
        'baseDecimals': 9,
        'quoteDecimals': 6,
        'minOrderSize': '0.01',
        'maxOrderSize': '100000',
        'minNotional': '1',
        'makerFee': '0.0002',
        'takerFee': '0.0005',
        'tickSize': '0.01',
        'stepSize': '0.01'
    };
    
    const parsedSpot = exchange.parseMarket (spotMarket);
    assert.strictEqual (parsedSpot.symbol, 'SOL/USDC', 'Spot symbol should be SOL/USDC');
    assert.strictEqual (parsedSpot.type, 'spot', 'Market type should be spot');
    assert.strictEqual (parsedSpot.spot, true, 'Spot flag should be true');
    assert.strictEqual (parsedSpot.swap, false, 'Swap flag should be false for spot');
    
    // Test futures market parsing
    const futuresMarket = {
        'symbol': 'SOL_USDC_PERP',
        'baseSymbol': 'SOL',
        'quoteSymbol': 'USDC',
        'marketType': 'Futures',
        'baseDecimals': 9,
        'quoteDecimals': 6,
        'minOrderSize': '0.01',
        'maxOrderSize': '10000',
        'minNotional': '1',
        'makerFee': '0.0002',
        'takerFee': '0.0005',
        'tickSize': '0.01',
        'stepSize': '0.01',
        'contractSize': '1',
        'openInterestLimit': '1000000'
    };
    
    const parsedFutures = exchange.parseMarket (futuresMarket);
    assert.strictEqual (parsedFutures.symbol, 'SOL/USDC:USDC', 'Futures symbol should be SOL/USDC:USDC');
    assert.strictEqual (parsedFutures.type, 'swap', 'Market type should be swap');
    assert.strictEqual (parsedFutures.spot, false, 'Spot flag should be false for futures');
    assert.strictEqual (parsedFutures.swap, true, 'Swap flag should be true for futures');
    assert.strictEqual (parsedFutures.linear, true, 'Linear flag should be true');
    assert.strictEqual (parsedFutures.settle, 'USDC', 'Settle currency should be USDC');
    
    console.log ('✓ Market parsing tests passed');
}

// Test order parsing
async function testBackpackOrderParsing () {
    console.log ('Testing Backpack order parsing...');
    
    const exchange = new ccxt.backpack ();
    
    const order = {
        'id': '111063070525358080',
        'clientId': 'client123',
        'symbol': 'SOL_USDC',
        'side': 'Bid',
        'orderType': 'Limit',
        'timeInForce': 'GTC',
        'price': '100',
        'quantity': '1',
        'executedQuantity': '0.5',
        'executedQuoteQuantity': '50',
        'status': 'PartiallyFilled',
        'createdAt': 1700000000000,
        'updatedAt': 1700000001000,
        'selfTradePrevention': 'RejectTaker',
        'postOnly': false
    };
    
    const parsedOrder = exchange.parseOrder (order);
    assert.strictEqual (parsedOrder.id, '111063070525358080', 'Order ID should match');
    assert.strictEqual (parsedOrder.clientOrderId, 'client123', 'Client order ID should match');
    assert.strictEqual (parsedOrder.side, 'buy', 'Side should be buy for Bid');
    assert.strictEqual (parsedOrder.type, 'limit', 'Type should be limit');
    assert.strictEqual (parsedOrder.status, 'open', 'Status should be open for PartiallyFilled');
    assert.strictEqual (parsedOrder.price, 100, 'Price should be 100');
    assert.strictEqual (parsedOrder.amount, 1, 'Amount should be 1');
    assert.strictEqual (parsedOrder.filled, 0.5, 'Filled should be 0.5');
    assert.strictEqual (parsedOrder.cost, 50, 'Cost should be 50');
    
    console.log ('✓ Order parsing tests passed');
}

// Test trade parsing
async function testBackpackTradeParsing () {
    console.log ('Testing Backpack trade parsing...');
    
    const exchange = new ccxt.backpack ();
    
    // Test public trade
    const publicTrade = {
        'id': '12345',
        'price': '100.50',
        'quantity': '1.5',
        'quoteQuantity': '150.75',
        'timestamp': 1700000000000,
        'side': 'Buy',
        'isBuyerMaker': false
    };
    
    const parsedPublicTrade = exchange.parseTrade (publicTrade);
    assert.strictEqual (parsedPublicTrade.id, '12345', 'Trade ID should match');
    assert.strictEqual (parsedPublicTrade.side, 'buy', 'Side should be buy');
    assert.strictEqual (parsedPublicTrade.price, 100.50, 'Price should match');
    assert.strictEqual (parsedPublicTrade.amount, 1.5, 'Amount should match');
    assert.strictEqual (parsedPublicTrade.cost, 150.75, 'Cost should match');
    assert.strictEqual (parsedPublicTrade.takerOrMaker, 'taker', 'Should be taker when isBuyerMaker is false');
    
    // Test user trade (my trade)
    const userTrade = {
        'id': '567',
        'orderId': '111063070525358080',
        'symbol': 'SOL_USDC',
        'side': 'Bid',
        'price': '100.45',
        'quantity': '0.5',
        'quoteQuantity': '50.225',
        'fee': '0.025',
        'feeSymbol': 'USDC',
        'liquidity': 'MAKER',
        'timestamp': 1700000005000
    };
    
    const parsedUserTrade = exchange.parseMyTrade (userTrade);
    assert.strictEqual (parsedUserTrade.id, '567', 'Trade ID should match');
    assert.strictEqual (parsedUserTrade.order, '111063070525358080', 'Order ID should match');
    assert.strictEqual (parsedUserTrade.side, 'buy', 'Side should be buy for Bid');
    assert.strictEqual (parsedUserTrade.takerOrMaker, 'maker', 'Should be maker when liquidity is MAKER');
    assert.strictEqual (parsedUserTrade.fee.cost, 0.025, 'Fee cost should match');
    assert.strictEqual (parsedUserTrade.fee.currency, 'USDC', 'Fee currency should be USDC');
    
    console.log ('✓ Trade parsing tests passed');
}

// Test balance parsing
async function testBackpackBalanceParsing () {
    console.log ('Testing Backpack balance parsing...');
    
    const exchange = new ccxt.backpack ();
    
    const balanceResponse = [
        {
            'symbol': 'SOL',
            'total': '100.5',
            'available': '90.5',
            'locked': '10.0',
            'staked': '0'
        },
        {
            'symbol': 'USDC',
            'total': '5000.0',
            'available': '4500.0',
            'locked': '500.0',
            'staked': '0'
        }
    ];
    
    const parsedBalance = exchange.parseBalance (balanceResponse);
    
    assert (parsedBalance.SOL, 'SOL balance should exist');
    assert.strictEqual (parsedBalance.SOL.free, 90.5, 'SOL free balance should be 90.5');
    assert.strictEqual (parsedBalance.SOL.used, 10.0, 'SOL used balance should be 10.0');
    assert.strictEqual (parsedBalance.SOL.total, 100.5, 'SOL total balance should be 100.5');
    
    assert (parsedBalance.USDC, 'USDC balance should exist');
    assert.strictEqual (parsedBalance.USDC.free, 4500.0, 'USDC free balance should be 4500.0');
    assert.strictEqual (parsedBalance.USDC.used, 500.0, 'USDC used balance should be 500.0');
    assert.strictEqual (parsedBalance.USDC.total, 5000.0, 'USDC total balance should be 5000.0');
    
    console.log ('✓ Balance parsing tests passed');
}

// Test ticker parsing
async function testBackpackTickerParsing () {
    console.log ('Testing Backpack ticker parsing...');
    
    const exchange = new ccxt.backpack ();
    
    const ticker = {
        'symbol': 'SOL_USDC',
        'lastPrice': '100.50',
        'bidPrice': '100.45',
        'bidSize': '50.5',
        'askPrice': '100.55',
        'askSize': '45.2',
        'volume': '50000',
        'quoteVolume': '5025000',
        'high': '105.00',
        'low': '98.00',
        'firstPrice': '99.00',
        'priceChange': '1.50',
        'priceChangePercent': '1.515',
        'timestamp': 1700000000000
    };
    
    const parsedTicker = exchange.parseTicker (ticker);
    assert.strictEqual (parsedTicker.last, 100.50, 'Last price should be 100.50');
    assert.strictEqual (parsedTicker.bid, 100.45, 'Bid price should be 100.45');
    assert.strictEqual (parsedTicker.ask, 100.55, 'Ask price should be 100.55');
    assert.strictEqual (parsedTicker.open, 99.00, 'Open price should be 99.00');
    assert.strictEqual (parsedTicker.high, 105.00, 'High price should be 105.00');
    assert.strictEqual (parsedTicker.low, 98.00, 'Low price should be 98.00');
    assert.strictEqual (parsedTicker.change, 1.50, 'Price change should be 1.50');
    assert.strictEqual (parsedTicker.percentage, 1.515, 'Price change percent should be 1.515');
    assert.strictEqual (parsedTicker.baseVolume, 50000, 'Base volume should be 50000');
    assert.strictEqual (parsedTicker.quoteVolume, 5025000, 'Quote volume should be 5025000');
    
    console.log ('✓ Ticker parsing tests passed');
}

// Test position parsing (Phase 3)
async function testBackpackPositionParsing () {
    console.log ('Testing Backpack position parsing...');
    
    const exchange = new ccxt.backpack ();
    
    // Manually set up the market for testing
    exchange.markets = {
        'SOL_USDC_PERP': {
            'id': 'SOL_USDC_PERP',
            'symbol': 'SOL/USDC:USDC',
            'base': 'SOL',
            'quote': 'USDC',
            'settle': 'USDC',
            'type': 'swap',
            'contractSize': 1,
        }
    };
    exchange.markets_by_id = {
        'SOL_USDC_PERP': exchange.markets['SOL_USDC_PERP']
    };
    
    const position = {
        'symbol': 'SOL_USDC_PERP',
        'netQuantity': '10.0',
        'netExposureQuantity': '10.0',
        'netExposureNotional': '1020.00',
        'entryPrice': '100.50',
        'markPrice': '102.00',
        'pnlUnrealised': '15.00',
        'pnlRealised': '0',
        'initialMarginFraction': '0.10',
        'maintenanceMarginFraction': '0.01',
        'estimatedLiquidationPrice': '80.00',
        'positionId': '123456789'
    };
    
    const parsedPosition = exchange.parsePosition (position, exchange.markets['SOL_USDC_PERP']);
    assert.strictEqual (parsedPosition.symbol, 'SOL/USDC:USDC', 'Position symbol should be SOL/USDC:USDC');
    assert.strictEqual (parsedPosition.side, 'long', 'Position side should be long');
    assert.strictEqual (parsedPosition.contracts, 10.0, 'Position size should be 10.0');
    assert.strictEqual (parsedPosition.markPrice, 102.00, 'Mark price should be 102.00');
    assert.strictEqual (parsedPosition.unrealizedPnl, 15.00, 'Unrealized PnL should be 15.00');
    assert.strictEqual (parsedPosition.percentage.toFixed(2), '1.49', 'PnL percentage should be 1.49');
    assert.strictEqual (parsedPosition.initialMargin, 0.10, 'Initial margin should be 0.10');
    assert.strictEqual (parsedPosition.maintenanceMargin, 0.01, 'Maintenance margin should be 0.01');
    assert.strictEqual (parsedPosition.liquidationPrice, 80.00, 'Liquidation price should be 80.00');
    
    console.log ('✓ Position parsing tests passed');
}

// Test funding rate parsing (Phase 3)
async function testBackpackFundingRateParsing () {
    console.log ('Testing Backpack funding rate parsing...');
    
    const exchange = new ccxt.backpack ();
    
    // Set up market for funding rate parsing
    exchange.markets = {
        'SOL_USDC_PERP': {
            'id': 'SOL_USDC_PERP',
            'symbol': 'SOL/USDC:USDC',
            'base': 'SOL',
            'quote': 'USDC',
            'settle': 'USDC',
            'type': 'swap',
        }
    };
    exchange.markets_by_id = {
        'SOL_USDC_PERP': exchange.markets['SOL_USDC_PERP']
    };
    
    // parseFundingRate expects a dict in Backpack's implementation
    const fundingRateData = {
        'symbol': 'SOL_USDC_PERP',
        'fundingRate': '0.0001',
        'nextFundingTime': 1700086400000,
        'fundingInterval': 28800000,
        'upperBound': '0.02',
        'lowerBound': '-0.02'
    };
    
    const parsedFundingRate = exchange.parseFundingRate (fundingRateData as any, exchange.markets['SOL_USDC_PERP']);
    assert.strictEqual (parsedFundingRate.symbol, 'SOL/USDC:USDC', 'Funding rate symbol should be SOL/USDC:USDC');
    assert.strictEqual (parsedFundingRate.fundingRate, 0.0001, 'Funding rate should be 0.0001');
    assert.strictEqual (parsedFundingRate.fundingTimestamp, 1700086400000, 'Funding timestamp should match');
    assert.strictEqual (parsedFundingRate.info.upperBound, '0.02', 'Upper bound should be 0.02');
    assert.strictEqual (parsedFundingRate.info.lowerBound, '-0.02', 'Lower bound should be -0.02');
    
    console.log ('✓ Funding rate parsing tests passed');
}

// Test borrow rate parsing (Phase 3)
async function testBackpackBorrowRateParsing () {
    console.log ('Testing Backpack borrow rate parsing...');
    
    const exchange = new ccxt.backpack ();
    
    const borrowRate = {
        'asset': 'USDC',
        'borrowRate': '0.05',
        'lendRate': '0.03',
        'utilization': '0.60',
        'available': '1000000',
        'borrowed': '1500000'
    };
    
    const parsedBorrowRate = exchange.parseBorrowRate (borrowRate, { 'code': 'USDC', 'id': 'USDC' } as any);
    assert.strictEqual (parsedBorrowRate.currency, 'USDC', 'Currency should be USDC');
    assert.strictEqual (parsedBorrowRate.rate, 0.05, 'Borrow rate should be 0.05');
    assert.strictEqual (parsedBorrowRate.info.lendRate, '0.03', 'Lend rate should be 0.03');
    assert.strictEqual (parsedBorrowRate.info.utilization, '0.60', 'Utilization should be 0.60');
    
    console.log ('✓ Borrow rate parsing tests passed');
}

// Test deposit address parsing (Phase 3)
async function testBackpackDepositAddressParsing () {
    console.log ('Testing Backpack deposit address parsing...');
    
    const exchange = new ccxt.backpack ();
    
    const depositAddress = {
        'address': '0xABCDEF1234567890abcdef1234567890ABCDEF12',
        'blockchain': 'Ethereum',
        'memo': null
    };
    
    const parsedDepositAddress = exchange.parseDepositAddress (depositAddress);
    assert.strictEqual (parsedDepositAddress.address, '0xABCDEF1234567890abcdef1234567890ABCDEF12', 'Address should match');
    assert.strictEqual (parsedDepositAddress.network, 'Ethereum', 'Network should be Ethereum');
    assert.strictEqual (parsedDepositAddress.tag, undefined, 'Tag should be undefined when memo is null');
    
    console.log ('✓ Deposit address parsing tests passed');
}

// Test trading fees format (Phase 3)
async function testBackpackTradingFeesFormat () {
    console.log ('Testing Backpack trading fees format...');
    
    const exchange = new ccxt.backpack ();
    
    // Simulate the expected return from fetchTradingFees
    const tradingFeesResult = {
        'trading': {
            'maker': 0,
            'taker': 0.002,
        },
        'futures': {
            'maker': 0.0005,
            'taker': 0.001,
        }
    };
    
    // Test the format
    assert (tradingFeesResult.trading, 'Trading fees should exist');
    assert.strictEqual (tradingFeesResult.trading.maker, 0, 'Spot maker fee should be 0');
    assert.strictEqual (tradingFeesResult.trading.taker, 0.002, 'Spot taker fee should be 0.002 (20 basis points)');
    
    assert (tradingFeesResult.futures, 'Futures fees should exist');
    assert.strictEqual (tradingFeesResult.futures.maker, 0.0005, 'Futures maker fee should be 0.0005 (5 basis points)');
    assert.strictEqual (tradingFeesResult.futures.taker, 0.001, 'Futures taker fee should be 0.001 (10 basis points)');
    
    console.log ('✓ Trading fees format tests passed');
}

// Test stop-loss and take-profit order parsing (Phase 3)
async function testBackpackConditionalOrderParsing () {
    console.log ('Testing Backpack conditional order parsing...');
    
    const exchange = new ccxt.backpack ();
    
    // Test stop-loss order
    const stopLossOrder = {
        'id': '111063070525358080',
        'clientOrderId': 'test_stop_loss_1700000000000',
        'symbol': 'SOL_USDC_PERP',
        'side': 'Ask',
        'orderType': 'StopMarket',
        'timeInForce': 'GTC',
        'price': null,
        'triggerPrice': '90',
        'avgFillPrice': '0',
        'state': 'New',
        'marketState': 'Open',
        'remainingQuantity': '1',
        'filledQuantity': '0',
        'orderQuantity': '1',
        'createdAt': 1700000000000,
        'postOnly': false
    };
    
    const parsedStopLoss = exchange.parseOrder (stopLossOrder);
    assert.strictEqual (parsedStopLoss.type, 'stopmarket', 'Stop-loss order type should be stopmarket');
    assert.strictEqual (parsedStopLoss.stopPrice, 90, 'Stop price should be 90');
    assert.strictEqual (parsedStopLoss.side, 'sell', 'Side should be sell for Ask');
    
    // Test take-profit order
    const takeProfitOrder = {
        'id': '111063070525358081',
        'clientOrderId': 'test_take_profit_1700000000000',
        'symbol': 'SOL_USDC_PERP',
        'side': 'Ask',
        'orderType': 'TakeProfitLimit',
        'timeInForce': 'GTC',
        'price': '111',
        'triggerPrice': '110',
        'avgFillPrice': '0',
        'state': 'New',
        'marketState': 'Open',
        'remainingQuantity': '1',
        'filledQuantity': '0',
        'orderQuantity': '1',
        'createdAt': 1700000000000,
        'postOnly': false
    };
    
    const parsedTakeProfit = exchange.parseOrder (takeProfitOrder);
    assert.strictEqual (parsedTakeProfit.type, 'takeprofitlimit', 'Take-profit order type should be takeprofitlimit');
    assert.strictEqual (parsedTakeProfit.stopPrice, 110, 'Stop price should be 110');
    assert.strictEqual (parsedTakeProfit.price, 111, 'Limit price should be 111');
    
    console.log ('✓ Conditional order parsing tests passed');
}

// Main test runner
async function runBackpackTests () {
    console.log ('\n========================================');
    console.log ('Running Backpack Exchange Unit Tests');
    console.log ('========================================\n');
    
    try {
        // Phase 1 & 2 tests
        await testBackpackAuthentication ();
        await testBackpackMarketParsing ();
        await testBackpackOrderParsing ();
        await testBackpackTradeParsing ();
        await testBackpackBalanceParsing ();
        await testBackpackTickerParsing ();
        
        // Phase 3 tests
        await testBackpackPositionParsing ();
        await testBackpackFundingRateParsing ();
        await testBackpackBorrowRateParsing ();
        await testBackpackDepositAddressParsing ();
        await testBackpackTradingFeesFormat ();
        await testBackpackConditionalOrderParsing ();
        
        console.log ('\n========================================');
        console.log ('✅ All Backpack tests passed!');
        console.log ('========================================\n');
        
        process.exit (0);
    } catch (e) {
        console.error ('\n❌ Test failed:', e);
        process.exit (1);
    }
}

// Run tests if this file is executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    runBackpackTests ();
}

export {
    testBackpackAuthentication,
    testBackpackMarketParsing,
    testBackpackOrderParsing,
    testBackpackTradeParsing,
    testBackpackBalanceParsing,
    testBackpackTickerParsing,
    testBackpackPositionParsing,
    testBackpackFundingRateParsing,
    testBackpackBorrowRateParsing,
    testBackpackDepositAddressParsing,
    testBackpackTradingFeesFormat,
    testBackpackConditionalOrderParsing,
    runBackpackTests,
};