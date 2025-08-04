# PRD: Add Backpack Exchange to CCXT

## Background & Motivation

CCXT provides a unified interface to multiple cryptocurrency exchanges, enabling developers to interact with different exchanges through a standardized API. Backpack is an emerging cryptocurrency exchange offering both spot and futures trading with REST and WebSocket APIs. 

Key differentiators of Backpack include:
- ED25519 cryptographic signature authentication (unique among most exchanges)
- Support for multiple blockchain networks
- Advanced order types including stop-loss and take-profit
- Auto-borrow and auto-lend functionality for margin trading
- Comprehensive futures trading capabilities

Integrating Backpack into CCXT allows developers to:
- Trade and gather market data through the standard CCXT API
- Access Backpack's liquidity alongside other exchanges
- Build cross-exchange arbitrage and trading strategies
- Leverage Backpack's unique features through CCXT's unified interface

Exchange modules in CCXT are implemented once in TypeScript, then automatically transpiled to JavaScript, Python, PHP, C#, and Go. This ensures consistency across all language bindings while maintaining a single source of truth.

## Goals

1. **Full REST API Integration**: Complete implementation of Backpack's REST API in TypeScript (`ts/src/backpack.ts`)
2. **Core CCXT Capabilities**: Support standard CCXT methods for market data, account endpoints, trading, and capital operations
3. **ED25519 Authentication**: Implement Backpack's unique ED25519 signature authentication scheme
4. **Multi-Market Support**: Handle both spot and futures markets with proper type differentiation
5. **WebSocket Foundation**: Provide WebSocket metadata and structure for future real-time data implementation
6. **Automatic Binding Generation**: Ensure proper transpilation to all supported languages
7. **Comprehensive Testing**: Include unit tests, integration tests, and test fixtures
8. **CCXT Standards Compliance**: Maintain CCXT's code style, error handling, and architectural patterns

## Non-Goals

1. Implementing proprietary Backpack features that don't map to CCXT's standard interface
2. Custom rate-limiting beyond CCXT's generic throttling mechanisms
3. Full WebSocket implementation in initial release (foundation only)
4. Backpack-specific trading strategies or algorithms
5. Support for deprecated Backpack API endpoints
6. Custom UI components or visualization tools

## User Stories

1. **Market Data Consumer**: As a developer, I can fetch markets, tickers, trades, OHLCV, and order books from Backpack via CCXT's standardized methods.

2. **Active Trader**: As a trader, I can create, edit, and cancel orders on Backpack through CCXT, including advanced order types like stop-loss and take-profit.

3. **Portfolio Manager**: As an account owner, I can view balances, deposits, withdrawals, trade history, and manage positions across spot and futures markets.

4. **Arbitrage Bot Developer**: As an algorithm developer, I can fetch balances and execute orders on Backpack alongside other exchanges using the same code interface.

5. **Risk Manager**: As a risk manager, I can monitor positions, set margin parameters, and track funding rates for futures positions.

6. **Data Analyst**: As a market analyst, I can collect historical trade data, order book snapshots, and OHLCV data for backtesting and analysis.

## Functional Requirements

### 1. Market Data (Public Endpoints)

- **fetchMarkets**: Retrieve all trading pairs with metadata (symbol, base, quote, active, type, spot/futures, precision, limits, fees)
- **fetchCurrencies**: Get all supported assets with network information
- **fetchTicker**: Fetch 24-hour ticker statistics for a single symbol
- **fetchTickers**: Fetch tickers for multiple symbols in one call
- **fetchOrderBook**: Get level-2 order book with configurable depth
- **fetchTrades**: Retrieve recent public trades (up to 1000)
- **fetchOHLCV**: Fetch candlestick/K-line data with various intervals
- **fetchTime**: Get server time for synchronization
- **fetchStatus**: Check system status and maintenance messages

### 2. Trading (Private Endpoints)

- **createOrder**: Place spot/futures orders with support for:
  - Market, Limit, Stop-Loss, Take-Profit order types
  - Post-only, IOC, FOK time-in-force options
  - Client order ID support
- **editOrder**: Modify existing orders (price, quantity)
- **cancelOrder**: Cancel a single order by ID
- **cancelAllOrders**: Cancel all open orders or by symbol
- **fetchOrder**: Get details of a specific order
- **fetchOrders**: Retrieve all orders with filtering options
- **fetchOpenOrders**: Get currently active orders
- **fetchClosedOrders**: Get completed/cancelled orders
- **fetchMyTrades**: Retrieve user's trade history with fees

### 3. Account Management

- **fetchBalance**: Get account balances for all assets
- **fetchPositions**: Retrieve futures positions (if applicable)
- **fetchDeposits**: Get deposit history with transaction details
- **fetchWithdrawals**: Get withdrawal history
- **fetchDepositAddress**: Generate deposit addresses for supported networks
- **withdraw**: Request withdrawal to external address
- **fetchTransactionFees**: Get current network fees
- **fetchTradingFees**: Get trading fee structure
- **fetchFundingRate**: Get current funding rate (futures)
- **fetchFundingRateHistory**: Historical funding rates

### 4. Margin & Lending (If Supported)

- **fetchBorrowRate**: Get current borrow rates
- **fetchBorrowRateHistory**: Historical borrow rates
- **repayMargin**: Repay borrowed funds
- **fetchMarginMode**: Get current margin mode
- **setMarginMode**: Switch between cross/isolated margin

### 5. WebSocket Support (Foundation)

- Metadata structure for WebSocket endpoints
- Stream type definitions (ticker, trades, depth, account updates)
- Subscription management placeholders
- Authentication flow for private streams

### 6. Authentication & Security

- **ED25519 Signature Generation**: Implement Backpack's unique ED25519 signing scheme
- **Request Headers**: Properly set X-Timestamp, X-Window, X-API-Key, X-Signature
- **Time Window Validation**: Handle configurable request validity windows (5000ms default)
- **Nonce Management**: Ensure request uniqueness
- **Error Handling**: Map Backpack errors to CCXT exception hierarchy

### 7. Error Handling

Map Backpack-specific error codes to CCXT exceptions:
- Invalid signature → AuthenticationError
- Insufficient balance → InsufficientFunds
- Order not found → OrderNotFound
- Rate limit exceeded → RateLimitExceeded
- Market closed → MarketClosed
- Invalid parameters → BadRequest

## Technical Requirements

### Architecture

1. **File Structure**:
   - Main implementation: `ts/src/backpack.ts`
   - Abstract interface: `ts/src/abstract/backpack.ts` (auto-generated)
   - WebSocket implementation: `ts/src/pro/backpack.ts` (future)
   - Test files: `ts/src/test/static/*/backpack.json`

2. **Class Hierarchy**:
   - Extend from `Exchange` base class
   - Import from `./abstract/backpack.js`
   - Override `describe()` method with exchange metadata

3. **API Configuration**:
   - REST base URL: `https://api.backpack.exchange/`
   - WebSocket URL: `wss://ws.backpack.exchange/`
   - Rate limit: 50-100 requests per second (configurable)
   - Request timeout: 10000ms default

4. **Dependencies**:
   - ED25519 cryptographic library (noble-curves)
   - Standard CCXT dependencies
   - No additional external libraries

### Implementation Standards

1. **Method Naming**: Follow CCXT conventions (fetchX, createX, etc.)
2. **Parameter Handling**: Support both positional and params object arguments
3. **Response Parsing**: Implement parseX helpers for each data type
4. **Precision Handling**: Use CCXT's Precise library for decimal operations
5. **Symbol Mapping**: Handle market symbol conversions
6. **Pagination**: Support limit/offset where applicable
7. **Timestamp Handling**: Convert between milliseconds/microseconds as needed

## Success Metrics

1. **Functionality**:
   - All core CCXT methods implemented and working
   - Successful order placement and cancellation
   - Accurate balance and position reporting
   - Proper error handling and recovery

2. **Quality**:
   - 100% of unit tests passing
   - No linting errors or warnings
   - Clean transpilation to all target languages
   - Documentation complete and accurate

3. **Performance**:
   - Response times comparable to direct API calls
   - Efficient request batching where possible
   - Proper rate limit handling without unnecessary delays

4. **Compatibility**:
   - Works with existing CCXT scripts without modification
   - Compatible with all CCXT language bindings
   - Follows CCXT coding standards and patterns

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ED25519 implementation complexity | High | Use well-tested noble-curves library, extensive testing |
| API changes/instability | Medium | Version detection, graceful degradation |
| Rate limiting during testing | Medium | Mock responses, request throttling |
| Incomplete API documentation | Medium | Reverse engineer from official clients, contact support |
| WebSocket complexity | Low | Defer to Phase 2, focus on REST first |

## Timeline

### Phase 1: Foundation (Days 1-2)
- Research and specification
- Basic exchange skeleton
- Authentication implementation
- Public market data methods

### Phase 2: Trading (Days 3-4)
- Order management methods
- Account balance and history
- Error handling
- Initial testing

### Phase 3: Advanced Features (Days 5-6)
- Futures-specific methods
- Margin/lending functionality
- WebSocket foundation
- Comprehensive testing

### Phase 4: Polish (Day 7)
- Documentation
- Test fixtures
- Code review
- Final testing

## Dependencies

1. **External**:
   - Backpack API documentation
   - Test API keys/sandbox environment
   - ED25519 cryptographic library

2. **Internal**:
   - CCXT base classes and utilities
   - Test framework
   - Build/transpilation system

## Documentation Requirements

1. **Code Documentation**:
   - JSDoc comments for all public methods
   - Inline comments for complex logic
   - Type definitions for all parameters and returns

2. **User Documentation**:
   - README updates with Backpack examples
   - Authentication setup guide
   - Supported features matrix
   - Known limitations

3. **Test Documentation**:
   - Test plan and coverage report
   - Manual testing checklist
   - Performance benchmarks

## Approval Criteria

- [ ] All functional requirements implemented
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Code review approved
- [ ] No critical bugs or security issues
- [ ] Performance meets expectations
- [ ] Successfully transpiles to all languages

## Appendix

### A. Backpack API Endpoints Reference

- System: `/api/v1/status`, `/api/v1/time`
- Markets: `/api/v1/markets`, `/api/v1/assets`
- Market Data: `/api/v1/depth`, `/api/v1/trades`, `/api/v1/ticker`
- Trading: `/api/v1/orders`, `/api/v1/orders/execute`
- Account: `/api/v1/account`, `/api/v1/balances`
- History: `/api/v1/fills`, `/api/v1/deposits`, `/api/v1/withdrawals`

### B. ED25519 Signature Example

```typescript
// Signature generation process
1. Order parameters alphabetically
2. Create query string
3. Append timestamp and window
4. Prefix with instruction type
5. Sign with ED25519 private key
6. Base64 encode signature
```

### C. Error Code Mapping

| Backpack Error | CCXT Exception |
|----------------|----------------|
| INVALID_SIGNATURE | AuthenticationError |
| INSUFFICIENT_FUNDS | InsufficientFunds |
| ORDER_NOT_FOUND | OrderNotFound |
| RATE_LIMIT | RateLimitExceeded |
| INVALID_PARAMETER | BadRequest |

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Author: Claude Code*