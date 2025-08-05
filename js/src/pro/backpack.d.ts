import backpackRest from '../backpack.js';
import type { Int, Str, OrderBook, Order, Trade, Ticker, OHLCV, Position } from '../base/types.js';
export default class backpack extends backpackRest {
    describe(): any;
    watchTicker(symbol: string, params?: {}): Promise<Ticker>;
    watchTrades(symbol: string, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    watchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<OrderBook>;
    watchOHLCV(symbol: string, timeframe?: string, since?: Int, limit?: Int, params?: {}): Promise<OHLCV[]>;
    watchOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    watchPositions(symbols?: string[], since?: Int, limit?: Int, params?: {}): Promise<Position[]>;
    handleTicker(client: any, message: any): void;
    handleTrade(client: any, message: any): void;
    handleOrderBook(client: any, message: any): void;
    handleOHLCV(client: any, message: any): void;
    parseWsOrder(order: any, market?: any): Order;
    handleOrderUpdate(client: any, message: any): void;
    parseWsPosition(position: any, market?: any): Position;
    handlePositionUpdate(client: any, message: any): void;
    handleMessage(client: any, message: any): void;
    handleAccountData(client: any, message: any): void;
    signWebSocketMessage(request: any, params?: {}): any;
    authenticate(params?: {}): Promise<boolean>;
}
