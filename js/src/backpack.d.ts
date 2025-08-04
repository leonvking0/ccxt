import Exchange from './abstract/backpack.js';
import type { Int, OrderSide, Balances, OrderType, Trade, Order, Str, Ticker, OrderBook, Market, Currency, Num, Dict, int } from './base/types.js';
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
    createOrder(symbol: string, type: OrderType, side: OrderSide, amount: number, price?: Num, params?: {}): Promise<Order>;
    cancelOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    fetchOpenOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    fetchMyTrades(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    parseMyTrade(trade: Dict, market?: Market): Trade;
    parseMyTrades(trades: object[], market?: Market, since?: Int, limit?: Int): Trade[];
    parseOrder(order: Dict, market?: Market): Order;
    parseOrderStatus(status: Str): string;
}
