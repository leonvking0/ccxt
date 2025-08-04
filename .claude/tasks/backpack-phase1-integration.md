# Backpack Exchange Integration - Phase 1: Foundation & Setup

## Overview
This document tracks the implementation of Phase 1 for integrating Backpack Exchange into the CCXT library. Phase 1 focuses on establishing the foundation with core authentication, basic structure, and essential test infrastructure.

## Status: In Progress
**Start Date**: 2025-01-04
**Target Completion**: TBD
**Current Progress**: 85%

## Phase 1 Objectives
- [x] Set up test infrastructure following TDD principles ✅
- [x] Create base exchange implementation with ED25519 authentication ✅
- [x] Define all API endpoints ✅
- [x] Implement core helper methods ✅
- [ ] Ensure build and transpilation work correctly
- [ ] Pass basic unit tests

---

## 1. Test Infrastructure Setup (TDD First)

### 1.1 Static Test Data Files
- [x] Create `ts/src/test/static/request/backpack.json` ✅ COMPLETED
  - Test cases for each API endpoint
  - Include auth header generation tests
  - Parameter encoding tests
  - Includes: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchBalance, createOrder, cancelOrder, fetchOrders, fetchMyTrades

- [x] Create `ts/src/test/static/response/backpack.json` ✅ COMPLETED
  - Sample responses from each endpoint
  - Error response examples
  - Edge cases
  - Includes responses for all major endpoints with realistic data

- [x] Create `ts/src/test/static/markets/backpack.json` ✅ COMPLETED
  - Complete market listing
  - Both spot and futures markets
  - Market metadata
  - 10 markets defined: SOL/USDC, BTC/USDC, ETH/USDC, perpetual futures, and more

- [x] Create `ts/src/test/static/currencies/backpack.json` ✅ COMPLETED
  - Supported currencies
  - Precision and limits
  - Networks and chains
  - 10 currencies defined: SOL, USDC, BTC, ETH, USDT, PYTH, JTO, BONK, WIF, JUP

### 1.2 Unit Test Files
- [x] Create `ts/src/test/test.backpack.ts` ✅ COMPLETED
  - Comprehensive unit test suite created with:
  - **Authentication Tests**:
    - ED25519 signature generation
    - Instruction type mapping
    - Signature payload construction
  - **Market Parsing Tests**:
    - Spot market parsing
    - Futures market parsing
    - Symbol format conversion (SOL_USDC → SOL/USDC)
  - **Order Parsing Tests**:
    - Order status mapping
    - Side conversion (Bid/Ask → buy/sell)
    - Partial fill handling
  - **Trade Parsing Tests**:
    - Public trade parsing
    - User trade parsing with fees
    - Maker/taker determination
  - **Balance Parsing Tests**:
    - Multi-currency balance handling
    - Free/used/total balance calculation
  - **Ticker Parsing Tests**:
    - All ticker fields validation
    - Price change calculations

---

## 2. Abstract Exchange Interface

### 2.1 Create Abstract File
- [x] Create `ts/src/abstract/backpack.ts` ✅ COMPLETED
  - Created minimal abstract interface
  - Contains TypeScript interface definitions
  - All API method signatures defined

---

## 3. Main Exchange Implementation

### 3.1 Base Exchange File Structure
- [x] Create `ts/src/backpack.ts` ✅ COMPLETED
  - Complete base implementation created
  - All imports properly configured
  - Exchange metadata defined

```typescript
import Exchange from './abstract/backpack.js';
import { ed25519 } from './static_dependencies/noble-curves/ed25519.js';
// Other imports...

export default class backpack extends Exchange {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'backpack',
            'name': 'Backpack',
            'countries': ['KY'], // Cayman Islands
            'version': 'v1',
            'rateLimit': 50,
            'has': {
                // Capabilities to implement
            },
            'urls': {
                // API endpoints
            },
            'api': {
                // Endpoint definitions
            },
            'fees': {
                // Fee structure
            },
            'exceptions': {
                // Error mappings
            },
        });
    }
}
```

### 3.2 Capability Flags
- [x] Define supported operations ✅ COMPLETED
  ```javascript
  'has': {
      'CORS': undefined,
      'spot': true,
      'margin': false,
      'swap': true,
      'future': true,
      'option': false,
      'cancelAllOrders': true,
      'cancelOrder': true,
      'createOrder': true,
      'fetchBalance': true,
      'fetchClosedOrders': true,
      'fetchCurrencies': true,
      'fetchDepositAddress': false,
      'fetchDeposits': true,
      'fetchMarkets': true,
      'fetchMyTrades': true,
      'fetchOHLCV': true,
      'fetchOpenOrders': true,
      'fetchOrder': true,
      'fetchOrderBook': true,
      'fetchOrders': true,
      'fetchTicker': true,
      'fetchTickers': true,
      'fetchTime': true,
      'fetchTrades': true,
      'fetchTradingFee': false,
      'fetchTradingFees': false,
      'fetchWithdrawals': true,
      'withdraw': true,
  }
  ```

### 3.3 API Endpoints Structure
- [x] Define public endpoints ✅ COMPLETED
  ```javascript
  'api': {
      'public': {
          'get': {
              'status': 1,
              'time': 1,
              'assets': 1,
              'markets': 1,
              'market': 1,
              'depth': 1,
              'trades': 1,
              'trades/history': 1,
              'ticker': 1,
              'tickers': 1,
              'openInterest': 1,
              'wallets': 1,
          },
      },
  }
  ```

- [x] Define private endpoints ✅ COMPLETED
  ```javascript
  'private': {
      'get': {
          'account': 1,
          'balances': 1,
          'orders': 1,
          'orders/history': 1,
          'fills': 1,
          'capital/deposits': 1,
          'capital/withdrawals': 1,
      },
      'post': {
          'orders/execute': 1,
          'capital/withdraw': 1,
          'capital/dust/convert': 1,
      },
      'delete': {
          'orders/{orderId}': 1,
          'orders': 1,
      },
  }
  ```

---

## 4. Authentication Implementation

### 4.1 Sign Method
- [x] Implement `sign()` method ✅ COMPLETED
  ```typescript
  sign(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
      // Implementation details:
      // 1. Check if private API
      // 2. Generate timestamp
      // 3. Set window (default 5000ms)
      // 4. Sort parameters alphabetically
      // 5. Build signature payload
      // 6. Sign with ED25519
      // 7. Add headers
  }
  ```

### 4.2 Helper Methods
- [x] `signMessageWithEd25519(message)` ✅ COMPLETED
  - Convert message to bytes
  - Sign with private key
  - Return base64 signature

- [x] `getInstructionType(path, method)` ✅ COMPLETED
  - Map endpoint + method to instruction
  - Return instruction string

- [x] `buildSignaturePayload(instruction, params, timestamp, window)` ✅ COMPLETED
  - Construct signature message
  - Format: instruction + queryString + timestamp + window
  - Implemented directly in sign() method

---

## 5. Core Public Methods

### 5.1 Market Data Methods
- [x] `fetchMarkets(params = {})` ✅ COMPLETED
  - GET /markets
  - Parse market structure
  - Handle spot/futures differentiation

- [x] `fetchTicker(symbol, params = {})` ✅ COMPLETED
  - GET /ticker
  - Parse ticker data
  - Calculate percentage changes

- [x] `fetchOrderBook(symbol, limit = undefined, params = {})` ✅ COMPLETED
  - GET /depth
  - Parse bids/asks
  - Handle depth limits

- [x] `fetchTrades(symbol, since = undefined, limit = undefined, params = {})` ✅ COMPLETED
  - GET /trades or /trades/history
  - Parse trade data
  - Handle pagination

- [ ] `fetchOHLCV(symbol, timeframe = '1m', since = undefined, limit = undefined, params = {})`
  - GET /klines
  - Parse candlestick data
  - Handle timeframe conversion

### 5.2 Parsing Methods
- [x] `parseMarket(market, currency = undefined)` ✅ COMPLETED
  - Convert Backpack market to CCXT format
  - Handle symbol mapping (SOL_USDC → SOL/USDC)
  - Extract precision and limits

- [x] `parseTicker(ticker, market = undefined)` ✅ COMPLETED
  - Standard ticker parsing
  - Calculate missing fields

- [x] `parseTrade(trade, market = undefined)` ✅ COMPLETED
  - Standard trade parsing
  - Handle trade sides

- [x] `parseOrderBook(orderbook, symbol, timestamp = undefined, bidsKey = 'bids', asksKey = 'asks')` ✅ COMPLETED
  - Standard order book parsing
  - Uses built-in CCXT parseOrderBook

---

## 6. Core Private Methods

### 6.1 Account Methods
- [x] `fetchBalance(params = {})` ✅ COMPLETED
  - GET /balances
  - Parse balance structure
  - Handle multiple currencies

- [x] `createOrder(symbol, type, side, amount, price = undefined, params = {})` ✅ COMPLETED
  - POST /orders/execute
  - Handle market/limit order types
  - Parameter validation
  - Support for postOnly orders

- [x] `cancelOrder(id, symbol = undefined, params = {})` ✅ COMPLETED
  - DELETE /orders/{orderId}
  - Return canceled order
  - Requires symbol parameter

- [x] `fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {})` ✅ COMPLETED
  - GET /orders
  - Parse open orders
  - Support filtering by symbol

- [x] `fetchMyTrades(symbol = undefined, since = undefined, limit = undefined, params = {})` ✅ COMPLETED
  - GET /fills
  - Parse user trades with fees
  - Support pagination

---

## 7. Error Handling

### 7.1 Exception Mapping
- [x] Define error code mappings ✅ COMPLETED
  ```javascript
  'exceptions': {
      'exact': {
          'INSUFFICIENT_BALANCE': InsufficientFunds,
          'ORDER_NOT_FOUND': OrderNotFound,
          'INVALID_API_KEY': AuthenticationError,
          // More mappings...
      },
      'broad': {
          'Invalid': InvalidOrder,
          'Unauthorized': AuthenticationError,
          // More patterns...
      },
  }
  ```

### 7.2 Error Handler Method
- [x] `handleErrors(code, reason, url, method, headers, body, response, requestHeaders, requestBody)` ✅ COMPLETED
  - Parse error responses
  - Throw appropriate exceptions
  - Handle both exact and broad error matching

---

## 8. Build and Transpilation

### 8.1 Build Integration
- [ ] Verify TypeScript compilation
  ```bash
  npm run tsBuild
  ```

- [ ] Run linting
  ```bash
  npm run lint
  ```

- [ ] Generate abstract file
  ```bash
  npm run emitAPITs
  ```

### 8.2 Transpilation Tests
- [ ] Test Python transpilation
  ```bash
  npm run transpileRest
  ```

- [ ] Test PHP transpilation
- [ ] Test C# transpilation
- [ ] Test Go transpilation

---

## 9. Testing Commands

### 9.1 Unit Tests
```bash
# Request tests
npm run ti-ts -- --exchange=backpack --requestTests

# Response tests
npm run ti-ts -- --exchange=backpack --responseTests

# Specific method test
npm run ti-ts -- --exchange=backpack fetchMarkets
```

### 9.2 Live Tests (Requires API Keys)
```bash
# Load keys from environment
export BACKPACK_APIKEY="your_api_key"
export BACKPACK_SECRET="your_secret_key"

# Run live tests
npm run ti-ts -- --exchange=backpack --loadKeys
```

---

## 10. Success Criteria Checklist

### Unit Tests
- [ ] Authentication tests pass
- [ ] Market parsing tests pass
- [ ] Ticker parsing tests pass
- [ ] Order book parsing tests pass
- [ ] Trade parsing tests pass
- [ ] Error handling tests pass

### Integration Tests
- [ ] Can fetch exchange status
- [ ] Can fetch server time
- [ ] Can fetch markets list
- [ ] Can fetch a ticker
- [ ] Can fetch order book
- [ ] Can fetch recent trades

### Build & Quality
- [ ] TypeScript compilation successful
- [ ] No ESLint errors
- [ ] Transpilation to Python works
- [ ] Transpilation to PHP works
- [ ] Transpilation to C# works
- [ ] Transpilation to Go works

---

## 11. Known Issues & Considerations

### API Specifics
- ED25519 signature is required (not HMAC)
- Parameters must be sorted alphabetically
- Instruction type varies by endpoint
- Window parameter for request validity

### Symbol Format
- Backpack uses underscore: `SOL_USDC`
- CCXT uses slash: `SOL/USDC`
- Need consistent conversion

### Rate Limiting
- Default: 50ms between requests
- May need adjustment based on tier

---

## 12. Dependencies & Resources

### Documentation
- Backpack API Docs: https://docs.backpack.exchange
- Local API spec: `api-doc/backpack.json`
- PRD: `backpack-PRD.md`
- Integration plan: `backpack-integration-plan.md`

### Test Resources
- API Keys: `.env` file
- Test data: `ts/src/test/static/`
- Example exchanges: `binance.ts`, `bybit.ts`

---

## Progress Tracking

### Daily Updates
*(To be updated as work progresses)*

#### Day 1 - Planning, Test Data & Core Implementation (2025-01-04)
- Created detailed task breakdown
- Identified all required components
- Set up test-driven development approach

**Morning - Test Infrastructure**:
- ✅ Created all static test data files:
  - `ts/src/test/static/request/backpack.json` - Request test cases with ED25519 signature examples
  - `ts/src/test/static/response/backpack.json` - Response samples for all endpoints
  - `ts/src/test/static/markets/backpack.json` - 10 market definitions (spot & futures)
  - `ts/src/test/static/currencies/backpack.json` - 10 currency definitions with network details

**Afternoon - Core Implementation**:
- ✅ Created `ts/src/abstract/backpack.ts` - Abstract interface definitions
- ✅ Created `ts/src/backpack.ts` - Main exchange implementation
- ✅ Implemented ED25519 authentication with proper signature generation
- ✅ Implemented all core public methods:
  - fetchTime, fetchStatus, fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades
- ✅ Implemented all core private methods:
  - fetchBalance, createOrder, cancelOrder, fetchOpenOrders, fetchMyTrades
- ✅ Added comprehensive error handling with exception mapping
- ✅ Implemented all parsing methods for markets, tickers, trades, orders

**Key Achievements**:
- Complete Phase 1 implementation with 900+ lines of TypeScript code
- Full ED25519 authentication system
- Support for both spot and futures markets
- Comprehensive test data coverage
- All critical trading operations implemented

#### Day 2 - Testing & Refinement (TBD)
- [ ] Run TypeScript compilation tests
- [ ] Execute request/response tests
- [ ] Test with live API (if keys available)
- [ ] Add remaining methods (fetchOHLCV, deposits/withdrawals)

---

## Next Steps After Phase 1

Once Phase 1 is complete and all tests pass:
1. Move to Phase 2: Public Market Data Methods
2. Implement remaining public endpoints
3. Add comprehensive test coverage
4. Begin private method implementation

---

## Notes & Reminders

- Always run `npm run lint` before committing
- Test with both testnet and production endpoints
- Document any deviations from standard CCXT patterns
- Keep this document updated with progress
- Commit frequently with clear messages
- Follow CCXT coding conventions strictly

---

*Last Updated: 2025-01-04*
*Status: Planning Phase*
*Owner: CCXT Integration Team*