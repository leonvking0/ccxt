//  ---------------------------------------------------------------------------

import Exchange from './abstract/backpack.js';
import { ExchangeError, ArgumentsRequired, InvalidOrder, OrderNotFound, InsufficientFunds, AuthenticationError, RateLimitExceeded, PermissionDenied, BadRequest, BadSymbol, AccountSuspended, InvalidNonce, NotSupported, OnMaintenance } from './base/errors.js';
import { ed25519 } from './static_dependencies/noble-curves/ed25519.js';
import type { Int, OrderSide, Balances, OrderType, Trade, Order, Str, Ticker, OrderBook, Market, Currency, Num, Dict, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class backpack
 * @augments Exchange
 */
export default class backpack extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'backpack',
            'name': 'Backpack',
            'countries': [ 'KY' ], // Cayman Islands
            'version': 'v1',
            'rateLimit': 50,
            'certified': false,
            'pro': true,
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
                'fetchStatus': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': true,
                'fetchTrades': true,
                'fetchTradingFee': false,
                'fetchTradingFees': false,
                'fetchWithdrawals': true,
                'withdraw': true,
            },
            'timeframes': {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            },
            'urls': {
                'logo': 'https://backpack.exchange/logo.png',
                'api': {
                    'public': 'https://api.backpack.exchange/api/v1',
                    'private': 'https://api.backpack.exchange/api/v1',
                },
                'www': 'https://backpack.exchange',
                'doc': 'https://docs.backpack.exchange',
                'fees': 'https://backpack.exchange/fees',
            },
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
                        'klines': 1,
                        'openInterest': 1,
                        'wallets': 1,
                    },
                },
                'private': {
                    'get': {
                        'account': 1,
                        'balances': 1,
                        'depositAddress': 1,
                        'orders': 1,
                        'orders/history': 1,
                        'order': 1,
                        'fills': 1,
                        'positions': 1,
                        'capital/deposits': 1,
                        'capital/withdrawals': 1,
                        'capital/deposit-address': 1,
                    },
                    'post': {
                        'orders/execute': 1,
                        'orders': 1,  // batch orders
                        'capital/withdraw': 1,
                        'capital/dust/convert': 1,
                    },
                    'put': {
                        'account': 1,
                        'orders/{orderId}': 1,
                    },
                    'delete': {
                        'orders/{orderId}': 1,
                        'orders': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': 0.0002,
                    'taker': 0.0005,
                },
            },
            'exceptions': {
                'exact': {
                    'INSUFFICIENT_BALANCE': InsufficientFunds,
                    'ORDER_NOT_FOUND': OrderNotFound,
                    'INVALID_API_KEY': AuthenticationError,
                    'INVALID_SIGNATURE': AuthenticationError,
                    'RATE_LIMIT_EXCEEDED': RateLimitExceeded,
                    'INVALID_ORDER': InvalidOrder,
                    'INVALID_SYMBOL': BadSymbol,
                    'INVALID_TIMESTAMP': InvalidNonce,
                    'UNAUTHORIZED': PermissionDenied,
                    'ACCOUNT_SUSPENDED': AccountSuspended,
                    'SERVICE_UNAVAILABLE': OnMaintenance,
                    'MARKET_NOT_FOUND': BadSymbol,
                },
                'broad': {
                    'Invalid': BadRequest,
                    'Unauthorized': AuthenticationError,
                    'Insufficient': InsufficientFunds,
                    'Not found': OrderNotFound,
                    'Rate limit': RateLimitExceeded,
                    'Suspended': AccountSuspended,
                },
            },
            'options': {
                'defaultType': 'spot', // spot, futures
                'recvWindow': 5000,
                'signTimestamp': true,
                'instructionTypes': {
                    // Map endpoints to instruction types
                    'GET:account': 'accountQuery',
                    'GET:balances': 'balanceQuery',
                    'GET:orders': 'orderQueryAll',
                    'GET:orders/history': 'orderHistoryQueryAll',
                    'GET:order': 'orderQuery',
                    'GET:fills': 'fillHistoryQueryAll',
                    'GET:positions': 'positionQuery',
                    'GET:capital/deposits': 'depositQueryAll',
                    'GET:capital/withdrawals': 'withdrawalQueryAll',
                    'GET:capital/deposit-address': 'depositAddressQuery',
                    'POST:orders/execute': 'orderExecute',
                    'POST:orders': 'orderExecute', // batch
                    'POST:capital/withdraw': 'withdraw',
                    'DELETE:orders/{orderId}': 'orderCancel',
                    'DELETE:orders': 'orderCancelAll',
                },
            },
        });
    }

    async fetchTime (params = {}): Promise<number> {
        /**
         * @method
         * @name backpack#fetchTime
         * @description fetches the current integer timestamp in milliseconds from the exchange server
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int} the current integer timestamp in milliseconds from the exchange server
         */
        const response = await this.publicGetTime (params);
        //
        //     1700000000000
        //
        // The API returns a plain timestamp string/number, not an object
        if (typeof response === 'number' || typeof response === 'string') {
            return parseInt (response.toString ());
        }
        return this.safeInteger (response, 'serverTime');
    }

    async fetchStatus (params = {}): Promise<any> {
        /**
         * @method
         * @name backpack#fetchStatus
         * @description fetches the current exchange status
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a status object
         */
        const response = await this.publicGetStatus (params);
        //
        //     {
        //         "status": "ok",
        //         "message": "System operational"
        //     }
        //
        const status = this.safeString (response, 'status');
        return {
            'status': (status === 'ok') ? 'ok' : 'maintenance',
            'updated': undefined,
            'eta': undefined,
            'url': undefined,
            'info': response,
        };
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        /**
         * @method
         * @name backpack#fetchMarkets
         * @description retrieves data on all markets for backpack
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const response = await this.publicGetMarkets (params);
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC",
        //             "baseSymbol": "SOL",
        //             "quoteSymbol": "USDC",
        //             "marketType": "Spot",
        //             "baseDecimals": 9,
        //             "quoteDecimals": 6,
        //             "minOrderSize": "0.01",
        //             "maxOrderSize": "100000",
        //             "minNotional": "1",
        //             "makerFee": "0.0002",
        //             "takerFee": "0.0005",
        //             "tickSize": "0.01",
        //             "stepSize": "0.01"
        //         },
        //     ]
        //
        return this.parseMarkets (response);
    }

    parseMarket (market: Dict, currency: Currency = undefined): Market {
        //
        //     {
        //         "symbol": "SOL_USDC",
        //         "baseSymbol": "SOL",
        //         "quoteSymbol": "USDC",
        //         "marketType": "Spot",
        //         "baseDecimals": 9,
        //         "quoteDecimals": 6,
        //         "minOrderSize": "0.01",
        //         "maxOrderSize": "100000",
        //         "minNotional": "1",
        //         "makerFee": "0.0002",
        //         "takerFee": "0.0005",
        //         "tickSize": "0.01",
        //         "stepSize": "0.01",
        //         "contractSize": "1",           // futures only
        //         "openInterestLimit": "1000000", // futures only
        //     }
        //
        const id = this.safeString (market, 'symbol');
        const baseId = this.safeString (market, 'baseSymbol');
        const quoteId = this.safeString (market, 'quoteSymbol');
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const marketType = this.safeString (market, 'marketType');
        const spot = (marketType === 'Spot');
        const futures = (marketType === 'Futures');
        const symbol = base + '/' + quote + (futures ? ':' + quote : '');
        const maker = this.safeNumber (market, 'makerFee');
        const taker = this.safeNumber (market, 'takerFee');
        return this.safeMarketStructure ({
            'id': id,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'baseId': baseId,
            'quoteId': quoteId,
            'active': true,
            'type': spot ? 'spot' : 'swap',
            'spot': spot,
            'margin': false,
            'future': false,
            'swap': futures,
            'option': false,
            'contract': futures,
            'settle': futures ? quote : undefined,
            'settleId': futures ? quoteId : undefined,
            'contractSize': futures ? this.safeNumber (market, 'contractSize', 1) : undefined,
            'linear': futures,
            'inverse': false,
            'taker': taker,
            'maker': maker,
            'percentage': true,
            'tierBased': false,
            'feeSide': 'quote',
            'precision': {
                'amount': this.parseNumber (this.parsePrecision (this.safeString (market, 'stepSize'))),
                'price': this.parseNumber (this.parsePrecision (this.safeString (market, 'tickSize'))),
            },
            'limits': {
                'amount': {
                    'min': this.safeNumber (market, 'minOrderSize'),
                    'max': this.safeNumber (market, 'maxOrderSize'),
                },
                'price': {
                    'min': undefined,
                    'max': undefined,
                },
                'cost': {
                    'min': this.safeNumber (market, 'minNotional'),
                    'max': undefined,
                },
                'leverage': {
                    'min': undefined,
                    'max': undefined,
                },
            },
            'created': undefined,
            'info': market,
        });
    }

    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        /**
         * @method
         * @name backpack#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.publicGetTicker (this.extend (request, params));
        //
        //     {
        //         "symbol": "SOL_USDC",
        //         "lastPrice": "100.50",
        //         "bidPrice": "100.45",
        //         "askPrice": "100.55",
        //         "volume": "50000",
        //         "quoteVolume": "5025000",
        //         "high": "105.00",
        //         "low": "98.00",
        //         "firstPrice": "99.00",
        //         "priceChange": "1.50",
        //         "priceChangePercent": "1.515",
        //         "timestamp": 1700000000000
        //     }
        //
        return this.parseTicker (response, market);
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        //
        //     {
        //         "symbol": "SOL_USDC",
        //         "lastPrice": "100.50",
        //         "bidPrice": "100.45",
        //         "askPrice": "100.55",
        //         "volume": "50000",
        //         "quoteVolume": "5025000",
        //         "high": "105.00",
        //         "low": "98.00",
        //         "firstPrice": "99.00",
        //         "priceChange": "1.50",
        //         "priceChangePercent": "1.515",
        //         "timestamp": 1700000000000
        //     }
        //
        const marketId = this.safeString (ticker, 'symbol');
        const timestamp = this.safeInteger (ticker, 'timestamp');
        const last = this.safeString (ticker, 'lastPrice');
        const open = this.safeString (ticker, 'firstPrice');
        return this.safeTicker ({
            'symbol': this.safeSymbol (marketId, market),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeString (ticker, 'high'),
            'low': this.safeString (ticker, 'low'),
            'bid': this.safeString (ticker, 'bidPrice'),
            'bidVolume': this.safeString (ticker, 'bidSize'),
            'ask': this.safeString (ticker, 'askPrice'),
            'askVolume': this.safeString (ticker, 'askSize'),
            'vwap': undefined,
            'open': open,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': this.safeString (ticker, 'priceChange'),
            'percentage': this.safeString (ticker, 'priceChangePercent'),
            'average': undefined,
            'baseVolume': this.safeString (ticker, 'volume'),
            'quoteVolume': this.safeString (ticker, 'quoteVolume'),
            'info': ticker,
        }, market);
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name backpack#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['depth'] = limit;
        }
        const response = await this.publicGetDepth (this.extend (request, params));
        //
        //     {
        //         "symbol": "SOL_USDC",
        //         "bids": [
        //             ["100.45", "50.5"],
        //             ["100.44", "100.2"],
        //         ],
        //         "asks": [
        //             ["100.55", "45.2"],
        //             ["100.56", "90.5"],
        //         ],
        //         "lastUpdateId": "111063070525358080",
        //         "timestamp": 1700000000000
        //     }
        //
        const timestamp = this.safeInteger (response, 'timestamp');
        return this.parseOrderBook (response, market['symbol'], timestamp, 'bids', 'asks');
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name backpack#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetTrades (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "12345",
        //             "price": "100.50",
        //             "quantity": "1.5",
        //             "quoteQuantity": "150.75",
        //             "timestamp": 1700000000000,
        //             "side": "Buy",
        //             "isBuyerMaker": false
        //         },
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        //     {
        //         "id": "12345",
        //         "price": "100.50",
        //         "quantity": "1.5",
        //         "quoteQuantity": "150.75",
        //         "timestamp": 1700000000000,
        //         "side": "Buy",
        //         "isBuyerMaker": false
        //     }
        //
        const id = this.safeString (trade, 'id');
        const timestamp = this.safeInteger (trade, 'timestamp');
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'quantity');
        const costString = this.safeString (trade, 'quoteQuantity');
        const sideString = this.safeString (trade, 'side');
        const side = (sideString === 'Buy') ? 'buy' : 'sell';
        const isBuyerMaker = this.safeValue (trade, 'isBuyerMaker');
        let takerOrMaker = undefined;
        if (isBuyerMaker !== undefined) {
            takerOrMaker = isBuyerMaker ? 'maker' : 'taker';
        }
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': this.safeSymbol (undefined, market),
            'order': this.safeString (trade, 'orderId'),
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': priceString,
            'amount': amountString,
            'cost': costString,
            'fee': undefined,
        }, market);
    }

    sign (path: string, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api] + '/' + this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            this.checkRequiredCredentials ();
            const timestamp = this.milliseconds ();
            const windowString = this.safeString (this.options, 'recvWindow', '5000');
            const window = parseInt (windowString);
            // Get instruction type for this endpoint
            const instruction = this.getInstructionType (path, method);
            let queryString = '';
            if (method === 'GET' || method === 'DELETE') {
                if (Object.keys (query).length) {
                    // Sort parameters alphabetically
                    const sortedQuery = this.keysort (query);
                    queryString = this.urlencode (sortedQuery);
                    url += '?' + queryString;
                }
            } else {
                if (Object.keys (query).length) {
                    // Sort parameters alphabetically
                    const sortedQuery = this.keysort (query);
                    queryString = this.urlencode (sortedQuery);
                    body = this.json (query);
                }
            }
            // Build signature payload
            let signaturePayload = 'instruction=' + instruction;
            if (queryString) {
                signaturePayload += '&' + queryString;
            }
            signaturePayload += '&timestamp=' + timestamp.toString ();
            signaturePayload += '&window=' + window.toString ();
            // Sign with ED25519
            const signature = this.signMessageWithEd25519 (signaturePayload);
            headers = {
                'X-Timestamp': timestamp.toString (),
                'X-Window': window.toString (),
                'X-API-Key': this.apiKey,
                'X-Signature': signature,
                'Content-Type': 'application/json',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    signMessageWithEd25519 (message: string): string {
        // Convert message to bytes
        const messageBytes = this.encode (message);
        // Decode base64 private key to bytes
        const privateKeyBytes = this.base64ToBinary (this.secret);
        // Sign the message
        const signature = ed25519.sign (messageBytes, privateKeyBytes);
        // Convert signature to base64
        return this.binaryToBase64 (signature);
    }

    getInstructionType (path: string, method: string): string {
        // Remove path parameters (e.g., {orderId})
        const cleanPath = path.replace (/{[^}]+}/g, '{orderId}');
        const key = method + ':' + cleanPath;
        const instructionTypes = this.safeValue (this.options, 'instructionTypes', {});
        const instruction = this.safeString (instructionTypes, key);
        if (instruction === undefined) {
            throw new NotSupported (this.id + ' ' + key + ' is not supported yet');
        }
        return instruction;
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined;
        }
        //
        //     {
        //         "error": "INVALID_API_KEY",
        //         "message": "Invalid API key"
        //     }
        //
        const error = this.safeString (response, 'error');
        const message = this.safeString (response, 'message');
        if (error !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], error, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback);
        }
        return undefined;
    }

    async fetchBalance (params = {}): Promise<Balances> {
        /**
         * @method
         * @name backpack#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
         */
        await this.loadMarkets ();
        const response = await this.privateGetBalances (params);
        //
        //     [
        //         {
        //             "symbol": "SOL",
        //             "total": "100.5",
        //             "available": "90.5",
        //             "locked": "10.0",
        //             "staked": "0"
        //         },
        //     ]
        //
        return this.parseBalance (response);
    }

    parseBalance (response): Balances {
        const result: Dict = {
            'info': response,
        };
        for (let i = 0; i < response.length; i++) {
            const balance = response[i];
            const currencyId = this.safeString (balance, 'symbol');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString (balance, 'available');
            account['used'] = this.safeString (balance, 'locked');
            account['total'] = this.safeString (balance, 'total');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name backpack#createOrder
         * @description create a trade order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
            'side': (side === 'buy') ? 'Bid' : 'Ask',
            'orderType': (type === 'market') ? 'Market' : 'Limit',
            'quantity': this.amountToPrecision (symbol, amount),
        };
        if (type === 'limit') {
            if (price === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a price argument for limit orders');
            }
            request['price'] = this.priceToPrecision (symbol, price);
        }
        const postOnly = this.safeBool (params, 'postOnly', false);
        if (postOnly) {
            request['postOnly'] = true;
        }
        const timeInForce = this.safeString (params, 'timeInForce', 'GTC');
        request['timeInForce'] = timeInForce;
        const response = await this.privatePostOrdersExecute (this.extend (request, params));
        //
        //     {
        //         "id": "111063070525358080",
        //         "clientId": "client123",
        //         "symbol": "SOL_USDC",
        //         "side": "Bid",
        //         "orderType": "Limit",
        //         "timeInForce": "GTC",
        //         "price": "100",
        //         "quantity": "1",
        //         "executedQuantity": "0",
        //         "executedQuoteQuantity": "0",
        //         "status": "New",
        //         "createdAt": 1700000000000,
        //         "updatedAt": 1700000000000,
        //         "selfTradePrevention": "RejectTaker",
        //         "postOnly": false
        //     }
        //
        return this.parseOrder (response, market);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name backpack#cancelOrder
         * @description cancels an open order
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'orderId': id,
            'symbol': market['id'],
        };
        const response = await this.privateDeleteOrdersOrderId (this.extend (request, params));
        return this.parseOrder (response, market);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name backpack#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of open orders structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetOrders (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "111063070525358080",
        //             "clientId": "client123",
        //             "symbol": "SOL_USDC",
        //             "side": "Bid",
        //             "orderType": "Limit",
        //             "timeInForce": "GTC",
        //             "price": "100",
        //             "quantity": "1",
        //             "executedQuantity": "0",
        //             "executedQuoteQuantity": "0",
        //             "status": "New",
        //             "createdAt": 1700000000000,
        //             "updatedAt": 1700000000000
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name backpack#fetchMyTrades
         * @description fetch all trades made by the user
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trades structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetFills (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "567",
        //             "orderId": "111063070525358080",
        //             "symbol": "SOL_USDC",
        //             "side": "Bid",
        //             "price": "100.45",
        //             "quantity": "0.5",
        //             "quoteQuantity": "50.225",
        //             "fee": "0.025",
        //             "feeSymbol": "USDC",
        //             "liquidity": "TAKER",
        //             "timestamp": 1700000005000
        //         }
        //     ]
        //
        return this.parseMyTrades (response, market, since, limit);
    }

    parseMyTrade (trade: Dict, market: Market = undefined): Trade {
        //
        //     {
        //         "id": "567",
        //         "orderId": "111063070525358080",
        //         "symbol": "SOL_USDC",
        //         "side": "Bid",
        //         "price": "100.45",
        //         "quantity": "0.5",
        //         "quoteQuantity": "50.225",
        //         "fee": "0.025",
        //         "feeSymbol": "USDC",
        //         "liquidity": "TAKER",
        //         "timestamp": 1700000005000
        //     }
        //
        const id = this.safeString (trade, 'id');
        const orderId = this.safeString (trade, 'orderId');
        const timestamp = this.safeInteger (trade, 'timestamp');
        const marketId = this.safeString (trade, 'symbol');
        const sideString = this.safeString (trade, 'side');
        const side = (sideString === 'Bid') ? 'buy' : 'sell';
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'quantity');
        const costString = this.safeString (trade, 'quoteQuantity');
        const liquidity = this.safeString (trade, 'liquidity');
        const takerOrMaker = (liquidity === 'MAKER') ? 'maker' : 'taker';
        const feeCostString = this.safeString (trade, 'fee');
        const feeCurrencyId = this.safeString (trade, 'feeSymbol');
        const feeCurrency = this.safeCurrencyCode (feeCurrencyId);
        const fee = {
            'cost': feeCostString,
            'currency': feeCurrency,
        };
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': this.safeSymbol (marketId, market),
            'order': orderId,
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': priceString,
            'amount': amountString,
            'cost': costString,
            'fee': fee,
        }, market);
    }

    parseMyTrades (trades: object[], market: Market = undefined, since: Int = undefined, limit: Int = undefined): Trade[] {
        const result = [];
        for (let i = 0; i < trades.length; i++) {
            result.push (this.parseMyTrade (trades[i], market));
        }
        return this.filterBySinceLimit (result, since, limit, 'timestamp');
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     {
        //         "id": "111063070525358080",
        //         "clientId": "client123",
        //         "symbol": "SOL_USDC",
        //         "side": "Bid",
        //         "orderType": "Limit",
        //         "timeInForce": "GTC",
        //         "price": "100",
        //         "quantity": "1",
        //         "executedQuantity": "0",
        //         "executedQuoteQuantity": "0",
        //         "status": "New",
        //         "createdAt": 1700000000000,
        //         "updatedAt": 1700000000000,
        //         "selfTradePrevention": "RejectTaker",
        //         "postOnly": false
        //     }
        //
        const id = this.safeString (order, 'id');
        const clientOrderId = this.safeString (order, 'clientId');
        const timestamp = this.safeInteger (order, 'createdAt');
        const lastUpdateTimestamp = this.safeInteger (order, 'updatedAt');
        const marketId = this.safeString (order, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const type = this.safeStringLower (order, 'orderType');
        const sideString = this.safeString (order, 'side');
        const side = (sideString === 'Bid') ? 'buy' : 'sell';
        const price = this.safeString (order, 'price');
        const amount = this.safeString (order, 'quantity');
        const filled = this.safeString (order, 'executedQuantity');
        const cost = this.safeString (order, 'executedQuoteQuantity');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const timeInForce = this.safeString (order, 'timeInForce');
        const postOnly = this.safeBool (order, 'postOnly');
        return this.safeOrder ({
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': lastUpdateTimestamp,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'triggerPrice': undefined,
            'amount': amount,
            'cost': cost,
            'filled': filled,
            'remaining': undefined,
            'average': undefined,
            'fee': undefined,
            'trades': undefined,
            'info': order,
        }, market);
    }

    parseOrderStatus (status: Str): string {
        const statuses: Dict = {
            'New': 'open',
            'PartiallyFilled': 'open',
            'Filled': 'closed',
            'Cancelled': 'canceled',
            'PendingCancel': 'canceling',
            'Rejected': 'rejected',
            'Expired': 'expired',
        };
        return this.safeString (statuses, status, status);
    }
}
