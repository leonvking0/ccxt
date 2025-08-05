//  ---------------------------------------------------------------------------

import backpackRest from '../backpack.js';
import { ArgumentsRequired, AuthenticationError, BadRequest } from '../base/errors.js';
import { ArrayCache, ArrayCacheBySymbolById } from '../base/ws/Cache.js';
import { sha256 } from '../static_dependencies/noble-hashes/sha256.js';
import { Precise } from '../base/Precise.js';
import type { Int, Str, OrderBook, Order, Trade, Ticker, OHLCV, Balances, Position, Dict } from '../base/types.js';

//  ---------------------------------------------------------------------------

export default class backpack extends backpackRest {
    describe () {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                'watchBalance': false,
                'watchTicker': true,
                'watchTickers': false,
                'watchTrades': true,
                'watchTradesForSymbols': false,
                'watchOrderBook': true,
                'watchOrderBookForSymbols': false,
                'watchOrders': true,
                'watchOrdersForSymbols': false,
                'watchMyTrades': false,
                'watchOHLCV': true,
                'watchOHLCVForSymbols': false,
                'watchPosition': false,
                'watchPositions': true,
                'watchPositionsForSymbols': false,
            },
            'urls': {
                'api': {
                    'ws': 'wss://ws.backpack.exchange',
                },
            },
            'options': {
                'watchOrderBook': {
                    'depth': 'depth', // depth or bookTicker
                },
                'tradesLimit': 1000,
                'OHLCVLimit': 1000,
            },
            'streaming': {
                'keepAlive': 30000,
            },
        });
    }

    async watchTicker (symbol: string, params = {}): Promise<Ticker> {
        /**
         * @method
         * @name backpack#watchTicker
         * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const messageHash = 'ticker:' + market['symbol'];
        const url = this.urls['api']['ws'];
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ 'ticker.' + market['id'] ],
        };
        const request = this.extend (subscribe, params);
        return await this.watch (url, messageHash, request, messageHash);
    }

    async watchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name backpack#watchTrades
         * @description get the list of most recent trades for a particular symbol
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const messageHash = 'trades:' + symbol;
        const url = this.urls['api']['ws'];
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ 'trades.' + market['id'] ],
        };
        const request = this.extend (subscribe, params);
        const trades = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = trades.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (trades, since, limit, 'timestamp', true);
    }

    async watchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name backpack#watchOrderBook
         * @description watches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const messageHash = 'orderbook:' + symbol;
        const url = this.urls['api']['ws'];
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ 'depth.' + market['id'] ],
        };
        const request = this.extend (subscribe, params);
        const orderbook = await this.watch (url, messageHash, request, messageHash);
        return orderbook.limit ();
    }

    async watchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name backpack#watchOHLCV
         * @description watches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const interval = this.safeString (this.timeframes, timeframe, timeframe);
        const messageHash = 'ohlcv:' + symbol + ':' + interval;
        const url = this.urls['api']['ws'];
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ 'kline.' + interval + '.' + market['id'] ],
        };
        const request = this.extend (subscribe, params);
        const ohlcv = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = ohlcv.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (ohlcv, since, limit, 0, true);
    }

    async watchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name backpack#watchOrders
         * @description watches information on multiple orders made by the user
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        await this.authenticate ();
        let messageHash = 'orders';
        const url = this.urls['api']['ws'];
        let streamName = 'account.orderUpdate';
        if (symbol !== undefined) {
            const market = this.market (symbol);
            symbol = market['symbol'];
            messageHash = messageHash + ':' + symbol;
            streamName = streamName + '.' + market['id'];
        }
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ streamName ],
        };
        const request = this.signWebSocketMessage (subscribe, params);
        const orders = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = orders.getLimit (symbol, limit);
        }
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit, true);
    }

    async watchPositions (symbols: string[] = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Position[]> {
        /**
         * @method
         * @name backpack#watchPositions
         * @description watch all open positions
         * @see https://docs.backpack.exchange/#websocket-api
         * @param {string[]|undefined} symbols list of unified market symbols
         * @param {object} params extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
         */
        await this.loadMarkets ();
        await this.authenticate ();
        const messageHash = 'positions';
        const url = this.urls['api']['ws'];
        const streamName = 'account.positionUpdate';
        const subscribe: Dict = {
            'method': 'SUBSCRIBE',
            'params': [ streamName ],
        };
        const request = this.signWebSocketMessage (subscribe, params);
        const positions = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            return this.filterByArrayPositions (positions, symbols, since, limit, true);
        }
        return positions;
    }

    handleTicker (client, message) {
        //
        //     {
        //         "stream": "ticker.SOL_USDC",
        //         "data": {
        //             "e": "24hrTicker",
        //             "E": 1694687965941000,
        //             "s": "SOL_USDC",
        //             "c": "19.25",
        //             "o": "18.75",
        //             "h": "19.80",
        //             "l": "18.50",
        //             "v": "32123",
        //             "q": "612123.5",
        //             "p": "0.50",
        //             "P": "2.67",
        //             "C": 93828,
        //             "T": 1694687965940999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const marketId = this.safeString (data, 's');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const ticker = this.parseTicker (data, market);
        this.tickers[symbol] = ticker;
        const messageHash = 'ticker:' + symbol;
        client.resolve (ticker, messageHash);
    }

    handleTrade (client, message) {
        //
        //     {
        //         "stream": "trades.SOL_USDC",
        //         "data": {
        //             "e": "trade",
        //             "E": 1694687692980000,
        //             "s": "SOL_USDC",
        //             "t": 567,
        //             "p": "18.75",
        //             "q": "1.5",
        //             "m": false,
        //             "T": 1694687692979999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const marketId = this.safeString (data, 's');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const trade = this.parseTrade (data, market);
        const messageHash = 'trades:' + symbol;
        let stored = this.safeValue (this.trades, symbol);
        if (stored === undefined) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            stored = new ArrayCache (limit);
            this.trades[symbol] = stored;
        }
        stored.append (trade);
        client.resolve (stored, messageHash);
    }

    handleOrderBook (client, message) {
        //
        //     {
        //         "stream": "depth.SOL_USDC",
        //         "data": {
        //             "e": "depth",
        //             "E": 1694687965941000,
        //             "s": "SOL_USDC",
        //             "a": [["18.70", "0.000"]],
        //             "b": [["18.67", "0.832"], ["18.68", "0.000"]],
        //             "U": 94978271,
        //             "u": 94978271,
        //             "T": 1694687965940999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const marketId = this.safeString (data, 's');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const messageHash = 'orderbook:' + symbol;
        const timestamp = this.safeIntegerProduct (data, 'T', 0.001);
        const snapshot = this.safeValue (this.orderbooks, symbol);
        if (snapshot === undefined) {
            const orderbook = this.orderBook ({});
            orderbook['symbol'] = symbol;
            this.orderbooks[symbol] = orderbook;
        }
        const orderbook = this.orderbooks[symbol];
        const asks = this.safeValue (data, 'a', []);
        const bids = this.safeValue (data, 'b', []);
        this.handleDeltas (orderbook['asks'], asks);
        this.handleDeltas (orderbook['bids'], bids);
        orderbook['timestamp'] = timestamp;
        orderbook['datetime'] = this.iso8601 (timestamp);
        const firstUpdateId = this.safeInteger (data, 'U');
        const lastUpdateId = this.safeInteger (data, 'u');
        orderbook['nonce'] = lastUpdateId;
        client.resolve (orderbook, messageHash);
    }

    handleOHLCV (client, message) {
        //
        //     {
        //         "stream": "kline.1m.SOL_USDC",
        //         "data": {
        //             "e": "kline",
        //             "E": 1694687692980000,
        //             "s": "SOL_USD",
        //             "t": 123400000,
        //             "T": 123460000,
        //             "o": "18.75",
        //             "c": "19.25",
        //             "h": "19.80",
        //             "l": "18.50",
        //             "v": "32123",
        //             "n": 93828,
        //             "T": 1694687692979999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const marketId = this.safeString (data, 's');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const stream = this.safeString (message, 'stream', '');
        const parts = stream.split ('.');
        const interval = this.safeString (parts, 1);
        const messageHash = 'ohlcv:' + symbol + ':' + interval;
        const ohlcv = this.parseOHLCV (data, market);
        this.ohlcvs[symbol] = this.safeValue (this.ohlcvs, symbol, {});
        let stored = this.safeValue (this.ohlcvs[symbol], interval);
        if (stored === undefined) {
            const limit = this.safeInteger (this.options, 'OHLCVLimit', 1000);
            stored = new ArrayCacheBySymbolById (limit);
            this.ohlcvs[symbol][interval] = stored;
        }
        stored.append (ohlcv);
        client.resolve (stored, messageHash);
    }

    parseWsOrder (order, market = undefined) {
        //
        //     {
        //         "e": "orderAccepted",
        //         "E": 1694687692980000,
        //         "s": "SOL_USD",
        //         "c": 123,
        //         "S": "Bid",
        //         "o": "LIMIT",
        //         "f": "GTC",
        //         "q": "32123",
        //         "p": "20",
        //         "X": "Filled",
        //         "i": "1111343026172067",
        //         "l": "1.23",
        //         "z": "321",
        //         "L": "20",
        //         "m": true,
        //         "n": "23",
        //         "N": "USD",
        //         "T": 1694687692989999
        //     }
        //
        const id = this.safeString (order, 'i');
        const clientOrderId = this.safeString (order, 'c');
        const marketId = this.safeString (order, 's');
        const symbol = this.safeSymbol (marketId, market);
        const timestamp = this.safeIntegerProduct (order, 'E', 0.001);
        const type = this.safeStringLower (order, 'o');
        const side = this.safeString (order, 'S') === 'Bid' ? 'buy' : 'sell';
        const price = this.safeString (order, 'p');
        const amount = this.safeString (order, 'q');
        const filled = this.safeString (order, 'z');
        const status = this.parseOrderStatus (this.safeString (order, 'X'));
        const timeInForce = this.safeString (order, 'f');
        const lastTradeTimestamp = this.safeIntegerProduct (order, 'T', 0.001);
        const fee = undefined;
        if (order['n'] !== undefined && order['N'] !== undefined) {
            fee['cost'] = this.safeString (order, 'n');
            fee['currency'] = this.safeCurrencyCode (this.safeString (order, 'N'));
        }
        return this.safeOrder ({
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'side': side,
            'price': price,
            'amount': amount,
            'filled': filled,
            'remaining': undefined,
            'fee': fee,
            'info': order,
        }, market);
    }

    handleOrderUpdate (client, message) {
        //
        //     {
        //         "stream": "account.orderUpdate",
        //         "data": {
        //             "e": "orderAccepted",
        //             "E": 1694687692980000,
        //             "s": "SOL_USD",
        //             "c": 123,
        //             "S": "Bid",
        //             "o": "LIMIT",
        //             "f": "GTC",
        //             "q": "32123",
        //             "p": "20",
        //             "X": "Filled",
        //             "i": "1111343026172067",
        //             "T": 1694687692989999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const marketId = this.safeString (data, 's');
        const market = this.safeMarket (marketId);
        const parsed = this.parseWsOrder (data, market);
        const symbol = parsed['symbol'];
        const orderId = parsed['id'];
        if (this.orders === undefined) {
            const limit = this.safeInteger (this.options, 'ordersLimit', 1000);
            this.orders = new ArrayCacheBySymbolById (limit);
        }
        const cachedOrders = this.orders;
        cachedOrders.append (parsed);
        let messageHash = 'orders';
        client.resolve (this.orders, messageHash);
        messageHash = 'orders:' + symbol;
        client.resolve (this.orders, messageHash);
    }

    parseWsPosition (position, market = undefined) {
        //
        //     {
        //         "e": "positionOpened",
        //         "E": 1694687692980000,
        //         "s": "SOL_USDC_PERP",
        //         "b": 123,
        //         "B": 122,
        //         "l": 50,
        //         "f": 0.5,
        //         "M": 122,
        //         "m": 0.01,
        //         "q": 5,
        //         "Q": 6,
        //         "n": 732,
        //         "i": "1111343026172067",
        //         "p": "-1",
        //         "P": "0",
        //         "T": 1694687692989999
        //     }
        //
        const marketId = this.safeString (position, 's');
        market = this.safeMarket (marketId, market);
        const symbol = market['symbol'];
        const timestamp = this.safeIntegerProduct (position, 'E', 0.001);
        const contracts = this.safeString (position, 'q');
        const contractsString = Precise.stringAbs (contracts);
        const side = Precise.stringGt (contracts, '0') ? 'long' : 'short';
        const notional = this.safeString (position, 'n');
        const percentage = undefined;
        const lastPrice = this.safeString (position, 'M');
        const entryPrice = this.safeString (position, 'B');
        const unrealizedPnl = this.safeString (position, 'P');
        const realizedPnl = this.safeString (position, 'p');
        const maintenanceMarginPercentage = this.safeString (position, 'm');
        const maintenanceMargin = undefined;
        const initialMarginPercentage = this.safeString (position, 'f');
        const initialMargin = undefined;
        const liquidationPrice = this.safeString (position, 'l');
        return this.safePosition ({
            'info': position,
            'id': this.safeString (position, 'i'),
            'symbol': symbol,
            'contracts': this.parseNumber (contractsString),
            'contractSize': this.safeValue (market, 'contractSize'),
            'entryPrice': this.parseNumber (entryPrice),
            'markPrice': this.parseNumber (lastPrice),
            'notional': this.parseNumber (notional),
            'maintenanceMargin': maintenanceMargin,
            'maintenanceMarginPercentage': this.parseNumber (maintenanceMarginPercentage),
            'initialMargin': initialMargin,
            'initialMarginPercentage': this.parseNumber (initialMarginPercentage),
            'unrealizedPnl': this.parseNumber (unrealizedPnl),
            'realizedPnl': this.parseNumber (realizedPnl),
            'percentage': percentage,
            'collateral': undefined,
            'marginMode': 'cross',
            'marginRatio': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'side': side,
            'hedged': false,
            'liquidationPrice': this.parseNumber (liquidationPrice),
        });
    }

    handlePositionUpdate (client, message) {
        //
        //     {
        //         "stream": "account.positionUpdate",
        //         "data": {
        //             "e": "positionOpened",
        //             "E": 1694687692980000,
        //             "s": "SOL_USDC_PERP",
        //             "b": 123,
        //             "B": 122,
        //             "l": 50,
        //             "f": 0.5,
        //             "M": 122,
        //             "m": 0.01,
        //             "q": 5,
        //             "Q": 6,
        //             "n": 732,
        //             "i": "1111343026172067",
        //             "p": "-1",
        //             "P": "0",
        //             "T": 1694687692989999
        //         }
        //     }
        //
        const data = this.safeValue (message, 'data', {});
        const parsed = this.parseWsPosition (data);
        const symbol = parsed['symbol'];
        const positionId = parsed['id'];
        if (this.positions === undefined) {
            this.positions = new ArrayCacheBySymbolById ();
        }
        const cachedPositions = this.positions;
        cachedPositions.append (parsed);
        const messageHash = 'positions';
        client.resolve (this.positions, messageHash);
    }

    handleMessage (client, message) {
        //
        //     {
        //         "stream": "ticker.SOL_USDC",
        //         "data": {...}
        //     }
        //
        const stream = this.safeString (message, 'stream', '');
        const parts = stream.split ('.');
        const channel = this.safeString (parts, 0);
        const handlers: Dict = {
            'ticker': this.handleTicker,
            'trades': this.handleTrade,
            'depth': this.handleOrderBook,
            'kline': this.handleOHLCV,
            'account': this.handleAccountData,
        };
        const handler = this.safeValue (handlers, channel);
        if (handler !== undefined) {
            handler.call (this, client, message);
        }
    }

    handleAccountData (client, message) {
        const stream = this.safeString (message, 'stream', '');
        if (stream.indexOf ('orderUpdate') >= 0) {
            this.handleOrderUpdate (client, message);
        } else if (stream.indexOf ('positionUpdate') >= 0) {
            this.handlePositionUpdate (client, message);
        }
    }

    signWebSocketMessage (request, params = {}) {
        // Add WebSocket authentication
        const timestamp = this.milliseconds ();
        const window = this.safeInteger (this.options, 'recvWindow', 5000);
        const message = 'instruction=subscribe&timestamp=' + timestamp.toString () + '&window=' + window.toString ();
        const signature = this.signMessage (message, this.secret);
        request['signature'] = [ this.apiKey, signature, timestamp.toString (), window.toString () ];
        return request;
    }

    async authenticate (params = {}) {
        this.checkRequiredCredentials ();
        return true;
    }
}