import Exchange from './abstract/backpack.js';
import type { Int, OrderSide, Balances, OrderType, Trade, Order, Str, Ticker, OrderBook, Market, Currency, Num, Dict, int, OHLCV, Strings, Tickers, Currencies, Transaction } from './base/types.js';
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
}
