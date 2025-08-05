import Exchange from './abstract/backpack.js';
import type { Int, OrderSide, Balances, OrderType, Trade, Order, Str, Ticker, OrderBook, Market, Currency, Num, Dict, int, OHLCV, Strings, Tickers, Currencies, Transaction, Position, FundingRate, FundingRateHistory, OpenInterest, DepositAddress, TradingFees, BorrowInterest } from './base/types.js';
/**
 * @class backpack
 * @augments Exchange
 */
export default class backpack extends Exchange {
    describe(): any;
    fetchTime(params?: {}): Promise<number>;
    fetchStatus(params?: {}): Promise<any>;
    fetchMarkets(params?: {}): Promise<Market[]>;
    parseMarket(market: Dict, currency?: Currency): Market;
    fetchTicker(symbol: string, params?: {}): Promise<Ticker>;
    parseTicker(ticker: Dict, market?: Market): Ticker;
    fetchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<OrderBook>;
    fetchTrades(symbol: string, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    parseTrade(trade: Dict, market?: Market): Trade;
    fetchOHLCV(symbol: string, timeframe?: string, since?: Int, limit?: Int, params?: {}): Promise<OHLCV[]>;
    parseOHLCV(ohlcv: any, market?: Market): OHLCV;
    fetchTickers(symbols?: Strings, params?: {}): Promise<Tickers>;
    fetchCurrencies(params?: {}): Promise<Currencies>;
    parseCurrency(currency: Dict): Currency;
    sign(path: string, api?: string, method?: string, params?: {}, headers?: any, body?: any): {
        url: string;
        method: string;
        body: any;
        headers: any;
    };
    signMessageWithEd25519(message: string): string;
    getInstructionType(path: string, method: string): string;
    handleErrors(code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: any, requestBody: any): any;
    fetchBalance(params?: {}): Promise<Balances>;
    parseBalance(response: any): Balances;
    fetchCollateral(params?: {}): Promise<Dict>;
    parseCollateral(response: any): Dict;
    createOrder(symbol: string, type: OrderType, side: OrderSide, amount: number, price?: Num, params?: {}): Promise<Order>;
    cancelOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    cancelAllOrders(symbol?: Str, params?: {}): Promise<any>;
    fetchOpenOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    fetchMyTrades(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    parseMyTrade(trade: Dict, market?: Market): Trade;
    parseMyTrades(trades: object[], market?: Market, since?: Int, limit?: Int): Trade[];
    parseOrder(order: Dict, market?: Market): Order;
    parseOrderStatus(status: Str): string;
    fetchOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    fetchClosedOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    fetchOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    fetchDeposits(code?: Str, since?: Int, limit?: Int, params?: {}): Promise<Transaction[]>;
    fetchWithdrawals(code?: Str, since?: Int, limit?: Int, params?: {}): Promise<Transaction[]>;
    parseTransaction(transaction: Dict, currency?: Currency): Transaction;
    parseTransactionStatus(status: Str): string;
    withdraw(code: string, amount: number, address: string, tag?: Str, params?: {}): Promise<Transaction>;
    /**
     * @method
     * @name backpack#fetchPosition
     * @description fetch a single futures position
     * @see https://docs.backpack.exchange/#tag/Position/operation/get_position
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    fetchPosition(symbol: string, params?: {}): Promise<Position>;
    /**
     * @method
     * @name backpack#fetchPositions
     * @description fetch futures positions
     * @see https://docs.backpack.exchange/#tag/Position/operation/get_position
     * @param {string[]|undefined} symbols list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    fetchPositions(symbols?: Strings, params?: {}): Promise<Position[]>;
    parsePosition(position: Dict, market?: Market): Position;
    /**
     * @method
     * @name backpack#fetchFundingRate
     * @description fetch the current funding rate for a perpetual market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_fundingRates
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [funding rate structure]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}
     */
    fetchFundingRate(symbol: string, params?: {}): Promise<FundingRate>;
    /**
     * @method
     * @name backpack#fetchFundingRateHistory
     * @description fetch the history of funding payments for a perpetual market
     * @see https://docs.backpack.exchange/#tag/History/operation/get_history_funding
     * @param {string} symbol unified market symbol
     * @param {int} [since] timestamp in ms of the earliest funding payment
     * @param {int} [limit] the maximum number of funding payments to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [funding history structures]{@link https://docs.ccxt.com/#/?id=funding-history-structure}
     */
    fetchFundingRateHistory(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<FundingRateHistory[]>;
    parseFundingRate(contract: string, market?: Market): FundingRate;
    parseFundingRateHistory(fundingHistory: Dict, market?: Market): FundingRateHistory;
    parseFundingRateHistories(fundingHistories: any, market?: any, since?: Int, limit?: Int): any;
    /**
     * @method
     * @name backpack#fetchMarkPrice
     * @description fetch the mark price for a futures market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_markPrices
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary with mark price information for the market
     */
    fetchMarkPrice(symbol: string, params?: {}): Promise<Ticker>;
    /**
     * @method
     * @name backpack#fetchOpenInterest
     * @description fetch the open interest for a futures market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_openInterest
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an open interest structure
     */
    fetchOpenInterest(symbol: string, params?: {}): Promise<OpenInterest>;
    /**
     * @method
     * @name backpack#fetchBorrowRates
     * @description fetch the borrow and lend rates for a currency
     * @see https://docs.backpack.exchange/#tag/Borrow-Lend-Markets/operation/get_borrowLend_markets
     * @param {string} [code] unified currency code
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a list of borrow rate structures
     */
    fetchBorrowRates(code?: Str, params?: {}): Promise<Dict>;
    /**
     * @method
     * @name backpack#fetchBorrowRateHistory
     * @description fetch the historical borrow and lend rates for a currency
     * @see https://docs.backpack.exchange/#tag/Borrow-Lend-Markets/operation/get_borrowLend_markets_history
     * @param {string} code unified currency code
     * @param {int} [since] timestamp in ms of the earliest rate
     * @param {int} [limit] the maximum number of rate structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of borrow rate structures
     */
    fetchBorrowRateHistory(code: string, since?: Int, limit?: Int, params?: {}): Promise<Dict[]>;
    parseBorrowRate(borrowRate: Dict, currency?: Currency): Dict;
    borrowMargin(code: string, amount: number, symbol?: Str, params?: {}): Promise<Dict>;
    repayMargin(code: string, amount?: Num, symbol?: Str, params?: {}): Promise<Dict>;
    parseMarginLoan(loan: Dict, currency?: Currency): Dict;
    fetchBorrowInterest(code?: Str, symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<BorrowInterest[]>;
    parseBorrowInterests(borrowInterests: Dict[], market?: any): BorrowInterest[];
    parseBorrowInterest(info: Dict, market?: any): BorrowInterest;
    /**
     * @method
     * @name backpack#fetchDepositAddress
     * @description fetch the deposit address for a currency on a specified network
     * @see https://docs.backpack.exchange/#tag/Capital/operation/get_capital_deposit_address
     * @param {string} code unified currency code
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.network] unified network code
     * @returns {object} an address structure
     */
    fetchDepositAddress(code: string, params?: {}): Promise<DepositAddress>;
    parseDepositAddress(depositAddress: Dict, currency?: Currency): DepositAddress;
    fetchTradingFees(params?: {}): Promise<TradingFees>;
}
