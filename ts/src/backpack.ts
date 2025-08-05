//  ---------------------------------------------------------------------------

import Exchange from './abstract/backpack.js';
import { ExchangeError, ArgumentsRequired, InvalidOrder, OrderNotFound, InsufficientFunds, AuthenticationError, RateLimitExceeded, PermissionDenied, BadRequest, BadSymbol, AccountSuspended, InvalidNonce, NotSupported, OnMaintenance } from './base/errors.js';
import { ed25519 } from './static_dependencies/noble-curves/ed25519.js';
import { Precise } from './base/Precise.js';
import type { Int, OrderSide, Balances, OrderType, Trade, Order, Str, Ticker, OrderBook, Market, Currency, Num, Dict, int, OHLCV, Strings, Tickers, Currencies, Transaction, Position, FundingRate, FundingRateHistory, OpenInterest, DepositAddress, TradingFees, BorrowInterest } from './base/types.js';

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
                'margin': true,
                'futures': true,
                'swap': true,
                'future': true,
                'option': false,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'fetchBalance': true,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchDepositAddress': true,
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
                'fetchTradingFees': true,
                'fetchWithdrawals': true,
                'withdraw': true,
                'fetchPosition': true,
                'fetchPositions': true,
                'fetchFundingRate': true,
                'fetchFundingRateHistory': true,
                'fetchMarkPrice': true,
                'fetchOpenInterest': true,
                'fetchBorrowRates': true,
                'fetchBorrowRateHistory': true,
                'borrowMargin': true,
                'repayMargin': true,
                'fetchBorrowInterest': true,
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
                    'wapi': 'https://api.backpack.exchange/wapi/v1',
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
                        'fundingRates': 1,
                        'markPrices': 1,
                        'borrowLend/markets': 1,
                        'borrowLend/markets/history': 1,
                    },
                },
                'private': {
                    'get': {
                        'account': 1,
                        'capital': 1, // spot balance endpoint
                        'capital/collateral': 1, // margin/collateral endpoint
                        'position': 1, // futures positions endpoint
                        'depositAddress': 1,
                        'orders': 1,
                        'order': 1,
                        'fills': 1,
                        'positions': 1,
                    },
                    'post': {
                        'orders': 1,  // single and batch orders
                        'capital/dust/convert': 1,
                        'borrowLend': 1,
                    },
                    'put': {
                        'account': 1,
                        'orders/{orderId}': 1,
                    },
                    'delete': {
                        'order': 1,   // cancel single order
                        'orders': 1,  // cancel all orders
                    },
                },
                'wapi': {
                    'get': {
                        'history/orders': 1,
                        'capital/deposits': 1,
                        'capital/withdrawals': 1,
                        'history/funding': 1,
                        'history/interest': 1,
                        'history/pnl': 1,
                        'history/settlement': 1,
                        'capital/deposit/address': 1,
                    },
                    'post': {
                        'capital/withdraw': 1,
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
                    'GET:capital': 'balanceQuery',
                    'GET:capital/collateral': 'collateralQuery',
                    'GET:orders': 'orderQueryAll',
                    'GET:history/orders': 'orderHistoryQueryAll',
                    'GET:order': 'orderQuery',
                    'GET:fills': 'fillHistoryQueryAll',
                    'GET:positions': 'positionQuery',
                    'GET:capital/deposits': 'depositQueryAll',
                    'GET:capital/withdrawals': 'withdrawalQueryAll',
                    'GET:position': 'positionQuery',
                    'GET:history/funding': 'fundingHistoryQueryAll',
                    'GET:history/interest': 'interestHistoryQueryAll',
                    'GET:history/pnl': 'pnlHistoryQueryAll',
                    'GET:history/settlement': 'settlementHistoryQueryAll',
                    'GET:capital/deposit/address': 'depositAddressQuery',
                    'POST:orders': 'orderExecute',
                    'POST:borrowLend': 'borrowLendExecute',
                    'POST:capital/withdraw': 'withdraw',
                    'DELETE:order': 'orderCancel',
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
        const spot = (marketType === 'SPOT');
        const futures = (marketType === 'FUTURES' || marketType === 'PERP');
        const symbol = base + '/' + quote + (futures ? ':' + quote : '');
        const maker = this.safeNumber (market, 'makerFee');
        const taker = this.safeNumber (market, 'takerFee');
        // Extract filters for price and quantity
        const filters = this.safeDict (market, 'filters', {});
        const priceFilter = this.safeDict (filters, 'price', {});
        const quantityFilter = this.safeDict (filters, 'quantity', {});
        const tickSize = this.safeString (priceFilter, 'tickSize');
        const stepSize = this.safeString (quantityFilter, 'stepSize');
        const minQuantity = this.safeString (quantityFilter, 'minQuantity');
        const maxQuantity = this.safeString (quantityFilter, 'maxQuantity');
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
                'amount': stepSize ? this.parseNumber (stepSize) : undefined,
                'price': tickSize ? this.parseNumber (tickSize) : undefined,
            },
            'limits': {
                'amount': {
                    'min': this.safeNumber2 (market, 'minOrderSize', minQuantity),
                    'max': this.safeNumber2 (market, 'maxOrderSize', maxQuantity),
                },
                'price': {
                    'min': this.safeNumber (priceFilter, 'minPrice'),
                    'max': this.safeNumber (priceFilter, 'maxPrice'),
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

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name backpack#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://docs.backpack.exchange/#tag/MarketData/operation/get_klines
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        // startTime is required - use since if provided, otherwise use 1 hour ago
        const now = this.milliseconds ();
        let startTime = since;
        if (startTime === undefined) {
            startTime = now - 3600000; // Default to 1 hour ago
        }
        // Convert milliseconds to seconds for the API
        request['startTime'] = Math.floor (startTime / 1000);
        // If limit is specified, calculate endTime based on timeframe
        if (limit !== undefined) {
            const duration = this.parseTimeframe (timeframe) * 1000; // Convert to milliseconds
            const endTime = startTime + (limit * duration);
            request['endTime'] = Math.floor (Math.min (endTime, now) / 1000);
        }
        const response = await this.publicGetKlines (this.extend (request, params));
        //
        //     [
        //         {
        //             "start": 1700000000,
        //             "open": "100.00",
        //             "high": "105.00",
        //             "low": "99.00",
        //             "close": "103.00",
        //             "volume": "1000.00",
        //             "end": 1700060000,
        //             "trades": 150
        //         }
        //     ]
        //
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        //
        //     {
        //         "start": "2025-08-04 20:00:00",
        //         "open": "100.00",
        //         "high": "105.00",
        //         "low": "99.00",
        //         "close": "103.00",
        //         "volume": "1000.00",
        //         "end": "2025-08-04 21:00:00",
        //         "trades": 150
        //     }
        //
        // The API returns date strings, convert to timestamp
        const dateString = this.safeString (ohlcv, 'start');
        const timestamp = this.parse8601 (dateString + 'Z'); // Add Z for UTC
        return [
            timestamp,
            this.safeNumber (ohlcv, 'open'),
            this.safeNumber (ohlcv, 'high'),
            this.safeNumber (ohlcv, 'low'),
            this.safeNumber (ohlcv, 'close'),
            this.safeNumber (ohlcv, 'volume'),
        ];
    }

    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        /**
         * @method
         * @name backpack#fetchTickers
         * @description fetches price tickers for multiple markets, statistical information calculated over the past 24 hours for each market
         * @see https://docs.backpack.exchange/#tag/MarketData/operation/get_tickers
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const response = await this.publicGetTickers (params);
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC",
        //             "firstPrice": "99.00",
        //             "lastPrice": "100.50",
        //             "priceChange": "1.50",
        //             "priceChangePercent": "1.515",
        //             "high": "105.00",
        //             "low": "98.00",
        //             "volume": "50000",
        //             "quoteVolume": "5025000",
        //             "trades": 1250,
        //             "bidPrice": "100.45",
        //             "bidSize": "100",
        //             "askPrice": "100.55",
        //             "askSize": "150",
        //             "prevDayClosePrice": "99.00",
        //             "timestamp": 1700000000000
        //         }
        //     ]
        //
        return this.parseTickers (response, symbols);
    }

    async fetchCurrencies (params = {}): Promise<Currencies> {
        /**
         * @method
         * @name backpack#fetchCurrencies
         * @description fetches all available currencies on an exchange
         * @see https://docs.backpack.exchange/#tag/Assets/operation/get_assets
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} an associative dictionary of currencies
         */
        const response = await this.publicGetAssets (params);
        //
        //     [
        //         {
        //             "symbol": "SOL",
        //             "tokens": [
        //                 {
        //                     "blockchain": "Solana",
        //                     "depositEnabled": true,
        //                     "minimumDeposit": "0.01",
        //                     "withdrawEnabled": true,
        //                     "minimumWithdrawal": "0.01",
        //                     "maximumWithdrawal": "100000",
        //                     "withdrawalFee": "0.01"
        //                 }
        //             ]
        //         }
        //     ]
        //
        const result: Dict = {};
        for (let i = 0; i < response.length; i++) {
            const currency = this.parseCurrency (response[i]);
            const code = currency['code'];
            result[code] = currency;
        }
        return result;
    }

    parseCurrency (currency: Dict): Currency {
        //
        //     {
        //         "symbol": "SOL",
        //         "tokens": [
        //             {
        //                 "blockchain": "Solana",
        //                 "depositEnabled": true,
        //                 "minimumDeposit": "0.01",
        //                 "withdrawEnabled": true,
        //                 "minimumWithdrawal": "0.01",
        //                 "maximumWithdrawal": "100000",
        //                 "withdrawalFee": "0.01"
        //             }
        //         ]
        //     }
        //
        const id = this.safeString (currency, 'symbol');
        const code = this.safeCurrencyCode (id);
        const tokens = this.safeValue (currency, 'tokens', []);
        const networks: Dict = {};
        let deposit = false;
        let withdraw = false;
        let fee = undefined;
        let minWithdraw = undefined;
        let maxWithdraw = undefined;
        for (let j = 0; j < tokens.length; j++) {
            const token = tokens[j];
            const networkId = this.safeString (token, 'blockchain');
            const networkCode = this.networkIdToCode (networkId);
            const depositEnabled = this.safeBool (token, 'depositEnabled', false);
            const withdrawEnabled = this.safeBool (token, 'withdrawEnabled', false);
            if (depositEnabled) {
                deposit = true;
            }
            if (withdrawEnabled) {
                withdraw = true;
            }
            fee = this.safeNumber (token, 'withdrawalFee', fee);
            minWithdraw = this.safeNumber (token, 'minimumWithdrawal', minWithdraw);
            maxWithdraw = this.safeNumber (token, 'maximumWithdrawal', maxWithdraw);
            networks[networkCode] = {
                'id': networkId,
                'network': networkCode,
                'deposit': depositEnabled,
                'withdraw': withdrawEnabled,
                'fee': this.safeNumber (token, 'withdrawalFee'),
                'precision': undefined,
                'limits': {
                    'deposit': {
                        'min': this.safeNumber (token, 'minimumDeposit'),
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': this.safeNumber (token, 'minimumWithdrawal'),
                        'max': this.safeNumber (token, 'maximumWithdrawal'),
                    },
                },
                'info': token,
            };
        }
        return this.safeCurrencyStructure ({
            'id': id,
            'code': code,
            'name': undefined,
            'active': deposit && withdraw,
            'deposit': deposit,
            'withdraw': withdraw,
            'fee': fee,
            'precision': undefined,
            'limits': {
                'amount': {
                    'min': undefined,
                    'max': undefined,
                },
                'withdraw': {
                    'min': minWithdraw,
                    'max': maxWithdraw,
                },
            },
            'networks': networks,
            'info': currency,
        });
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
            if (method === 'GET') {
                if (Object.keys (query).length) {
                    // Sort parameters alphabetically
                    const sortedQuery = this.keysort (query);
                    queryString = this.urlencode (sortedQuery);
                    url += '?' + queryString;
                }
            } else if (method === 'DELETE') {
                // For DELETE, pass parameters in body
                if (Object.keys (query).length) {
                    const sortedQuery = this.keysort (query);
                    queryString = this.urlencode (sortedQuery);
                    body = this.json (query);
                }
            } else {
                // Handle batch orders (array) differently
                if (Array.isArray (query)) {
                    // For batch orders, each order needs its own instruction prefix
                    const orderStrings = [];
                    for (let i = 0; i < query.length; i++) {
                        const order = query[i];
                        const sortedOrder = this.keysort (order);
                        const orderQuery = this.urlencode (sortedOrder);
                        orderStrings.push ('instruction=' + instruction + '&' + orderQuery);
                    }
                    queryString = orderStrings.join ('&');
                    body = this.json (query);
                } else if (Object.keys (query).length) {
                    // Sort parameters alphabetically
                    const sortedQuery = this.keysort (query);
                    queryString = this.urlencode (sortedQuery);
                    body = this.json (query);
                }
            }
            // Build signature payload
            let signaturePayload = '';
            if (Array.isArray (query)) {
                // For batch orders, queryString already contains the instruction prefixes
                signaturePayload = queryString;
            } else {
                signaturePayload = 'instruction=' + instruction;
                if (queryString) {
                    signaturePayload += '&' + queryString;
                }
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
        const response = await this.privateGetCapital (params);
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
        // Handle array of balances from /capital/balances endpoint
        if (Array.isArray (response)) {
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
        }
        return this.safeBalance (result);
    }

    async fetchCollateral (params = {}): Promise<Dict> {
        /**
         * @method
         * @name backpack#fetchCollateral
         * @description fetches the margin/collateral status for cross-margin trading
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a collateral structure with margin and risk information
         */
        await this.loadMarkets ();
        const response = await this.privateGetCapitalCollateral (params);
        //
        //     {
        //         "netEquity": "1000.00",
        //         "netEquityAvailable": "500.00",
        //         "collateral": [
        //             {
        //                 "symbol": "SOL",
        //                 "totalQuantity": "10.5",
        //                 "availableQuantity": "8.0",
        //                 "collateralWeight": "0.9",
        //                 "collateralValue": "945.00",
        //                 "openOrderQuantity": "2.5",
        //                 "lendQuantity": "0"
        //             }
        //         ]
        //     }
        //
        return this.parseCollateral (response);
    }

    parseCollateral (response): Dict {
        const netEquity = this.safeString (response, 'netEquity');
        const netEquityAvailable = this.safeString (response, 'netEquityAvailable');
        const collateralArray = this.safeList (response, 'collateral', []);
        const result: Dict = {
            'info': response,
            'netEquity': this.parseNumber (netEquity),
            'netEquityAvailable': this.parseNumber (netEquityAvailable),
            'collateral': {},
        };
        for (let i = 0; i < collateralArray.length; i++) {
            const item = collateralArray[i];
            const currencyId = this.safeString (item, 'symbol');
            const code = this.safeCurrencyCode (currencyId);
            result['collateral'][code] = {
                'total': this.safeNumber (item, 'totalQuantity'),
                'available': this.safeNumber (item, 'availableQuantity'),
                'collateralWeight': this.safeNumber (item, 'collateralWeight'),
                'collateralValue': this.safeNumber (item, 'collateralValue'),
                'openOrders': this.safeNumber (item, 'openOrderQuantity'),
                'lent': this.safeNumber (item, 'lendQuantity'),
            };
        }
        return result;
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
        // The API expects an array for the batch endpoint
        const requestArray = [ this.extend (request, params) ];
        const responseArray = await this.privatePostOrders (requestArray);
        // Response is an array since we sent a batch
        const response = this.safeDict (responseArray, 0);
        //
        //     [{
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
        //     }]
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
        const response = await (this as any).privateDeleteOrder (this.extend (request, params));
        return this.parseOrder (response, market);
    }

    async cancelAllOrders (symbol: Str = undefined, params = {}) {
        /**
         * @method
         * @name backpack#cancelAllOrders
         * @description cancel all open orders in a market
         * @param {string} symbol unified symbol of the market to cancel orders in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        if (symbol !== undefined) {
            const market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const response = await this.privateDeleteOrders (this.extend (request, params));
        return response;
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

    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name backpack#fetchOrders
         * @description fetches information on multiple orders made by the user
         * @see https://docs.backpack.exchange/#tag/History/operation/get_order_history
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
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
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetHistoryOrders (this.extend (request, params));
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
        //             "executedQuantity": "1",
        //             "executedQuoteQuantity": "100",
        //             "status": "Filled",
        //             "createdAt": 1700000000000,
        //             "updatedAt": 1700000005000
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name backpack#fetchClosedOrders
         * @description fetches information on multiple closed orders made by the user
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        const orders = await this.fetchOrders (symbol, since, limit, params);
        return this.filterByArray (orders, 'status', 'closed', false);
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name backpack#fetchOrder
         * @description fetches information on an order made by the user
         * @param {string} id the order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {
            'orderId': id,
        };
        const orders = await this.fetchOrders (symbol, undefined, undefined, this.extend (request, params));
        const numOrders = orders.length;
        if (numOrders === 0) {
            throw new OrderNotFound (this.id + ' order ' + id + ' not found');
        }
        return this.safeValue (orders, 0);
    }

    async fetchDeposits (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        /**
         * @method
         * @name backpack#fetchDeposits
         * @description fetch all deposits made to an account
         * @see https://docs.backpack.exchange/#tag/Capital/operation/get_deposits
         * @param {string} code unified currency code
         * @param {int} [since] the earliest time in ms to fetch deposits for
         * @param {int} [limit] the maximum number of deposits structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['symbol'] = currency['id'];
        }
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetCapitalDeposits (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "dep123",
        //             "toAddress": "0x1234...",
        //             "fromAddress": "0x5678...",
        //             "confirmations": 12,
        //             "requiredConfirmations": 10,
        //             "symbol": "USDC",
        //             "amount": "100",
        //             "fee": "0",
        //             "status": "Confirmed",
        //             "transactionHash": "0xabc...",
        //             "blockchainId": "Ethereum",
        //             "createdAt": 1700000000000
        //         }
        //     ]
        //
        return this.parseTransactions (response, currency, since, limit, { 'type': 'deposit' });
    }

    async fetchWithdrawals (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        /**
         * @method
         * @name backpack#fetchWithdrawals
         * @description fetch all withdrawals made from an account
         * @see https://docs.backpack.exchange/#tag/Capital/operation/get_withdrawals
         * @param {string} code unified currency code
         * @param {int} [since] the earliest time in ms to fetch withdrawals for
         * @param {int} [limit] the maximum number of withdrawals structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['symbol'] = currency['id'];
        }
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetCapitalWithdrawals (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "wit123",
        //             "toAddress": "0x1234...",
        //             "symbol": "USDC",
        //             "amount": "50",
        //             "fee": "1",
        //             "status": "Confirmed",
        //             "transactionHash": "0xdef...",
        //             "blockchainId": "Ethereum",
        //             "createdAt": 1700000000000
        //         }
        //     ]
        //
        return this.parseTransactions (response, currency, since, limit, { 'type': 'withdrawal' });
    }

    parseTransaction (transaction: Dict, currency: Currency = undefined): Transaction {
        //
        // deposit
        //     {
        //         "id": "dep123",
        //         "toAddress": "0x1234...",
        //         "fromAddress": "0x5678...",
        //         "confirmations": 12,
        //         "requiredConfirmations": 10,
        //         "symbol": "USDC",
        //         "amount": "100",
        //         "fee": "0",
        //         "status": "Confirmed",
        //         "transactionHash": "0xabc...",
        //         "blockchainId": "Ethereum",
        //         "createdAt": 1700000000000
        //     }
        //
        // withdrawal
        //     {
        //         "id": "wit123",
        //         "toAddress": "0x1234...",
        //         "symbol": "USDC",
        //         "amount": "50",
        //         "fee": "1",
        //         "status": "Confirmed",
        //         "transactionHash": "0xdef...",
        //         "blockchainId": "Ethereum",
        //         "createdAt": 1700000000000
        //     }
        //
        const id = this.safeString (transaction, 'id');
        const txid = this.safeString (transaction, 'transactionHash');
        const timestamp = this.safeInteger (transaction, 'createdAt');
        const currencyId = this.safeString (transaction, 'symbol');
        const code = this.safeCurrencyCode (currencyId, currency);
        const status = this.parseTransactionStatus (this.safeString (transaction, 'status'));
        const amount = this.safeNumber (transaction, 'amount');
        const toAddress = this.safeString (transaction, 'toAddress');
        const fromAddress = this.safeString (transaction, 'fromAddress');
        const fee = {
            'currency': code,
            'cost': this.safeNumber (transaction, 'fee'),
        };
        const networkId = this.safeString (transaction, 'blockchainId');
        const network = this.networkIdToCode (networkId);
        return {
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'network': network,
            'address': toAddress,
            'addressTo': toAddress,
            'addressFrom': fromAddress,
            'tag': undefined,
            'tagTo': undefined,
            'tagFrom': undefined,
            'type': undefined,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': undefined,
            'internal': false,
            'comment': undefined,
            'fee': fee,
            'info': transaction,
        };
    }

    parseTransactionStatus (status: Str): string {
        const statuses: Dict = {
            'Pending': 'pending',
            'Confirmed': 'ok',
            'Completed': 'ok',
            'Failed': 'failed',
            'Cancelled': 'canceled',
            'Rejected': 'rejected',
        };
        return this.safeString (statuses, status, status);
    }

    async withdraw (code: string, amount: number, address: string, tag: Str = undefined, params = {}): Promise<Transaction> {
        /**
         * @method
         * @name backpack#withdraw
         * @description make a withdrawal
         * @see https://docs.backpack.exchange/#tag/Capital/operation/request_withdrawal
         * @param {string} code unified currency code
         * @param {float} amount the amount to withdraw
         * @param {string} address the address to withdraw to
         * @param {string} tag
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [transaction structure]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'address': address,
            'symbol': currency['id'],
            'quantity': this.currencyToPrecision (code, amount),
        };
        const networks = this.safeDict (currency, 'networks');
        const network = this.safeString (params, 'network');
        params = this.omit (params, 'network');
        let networkId = undefined;
        if (network !== undefined) {
            const networkItem = this.safeDict (networks, network, {});
            networkId = this.safeString (networkItem, 'id');
        } else if (networks !== undefined) {
            const networkKeys = Object.keys (networks);
            const numNetworks = networkKeys.length;
            if (numNetworks === 1) {
                const networkItem = this.safeDict (networks, networkKeys[0], {});
                networkId = this.safeString (networkItem, 'id');
            }
        }
        if (networkId !== undefined) {
            request['blockchain'] = networkId;
        }
        if (tag !== undefined) {
            request['memo'] = tag;
        }
        const response = await this.wapiPostCapitalWithdraw (this.extend (request, params));
        //
        //     {
        //         "id": "wit456",
        //         "toAddress": "0x1234...",
        //         "symbol": "USDC",
        //         "amount": "50",
        //         "fee": "1",
        //         "status": "Pending",
        //         "transactionHash": null,
        //         "blockchainId": "Ethereum",
        //         "createdAt": 1700000010000
        //     }
        //
        return this.parseTransaction (response, currency);
    }

    /**
     * @method
     * @name backpack#fetchPosition
     * @description fetch a single futures position
     * @see https://docs.backpack.exchange/#tag/Position/operation/get_position
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    async fetchPosition (symbol: string, params = {}): Promise<Position> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.privateGetPosition (this.extend (request, params));
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "netQuantity": "5",
        //         "netExposureQuantity": "6",
        //         "netExposureNotional": "732",
        //         "entryPrice": "122",
        //         "markPrice": "122",
        //         "breakEvenPrice": "123",
        //         "estimatedLiquidationPrice": "50",
        //         "initialMarginFraction": "0.5",
        //         "maintenanceMarginFraction": "0.01",
        //         "pnlRealised": "-1",
        //         "pnlUnrealised": "0",
        //         "positionId": "1111343026172067"
        //     }
        //
        return this.parsePosition (response, market);
    }

    /**
     * @method
     * @name backpack#fetchPositions
     * @description fetch futures positions
     * @see https://docs.backpack.exchange/#tag/Position/operation/get_position
     * @param {string[]|undefined} symbols list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    async fetchPositions (symbols: Strings = undefined, params = {}): Promise<Position[]> {
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbols !== undefined) {
            // backpack only supports fetching one position at a time
            if (symbols.length !== 1) {
                throw new BadRequest (this.id + ' fetchPositions() requires exactly one symbol');
            }
            market = this.market (symbols[0]);
            request['symbol'] = market['id'];
        }
        const response = await this.privateGetPosition (this.extend (request, params));
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "netQuantity": "5",
        //         "netExposureQuantity": "6",
        //         "netExposureNotional": "732",
        //         "entryPrice": "122",
        //         "markPrice": "122",
        //         "breakEvenPrice": "123",
        //         "estimatedLiquidationPrice": "50",
        //         "initialMarginFraction": "0.5",
        //         "maintenanceMarginFraction": "0.01",
        //         "pnlRealised": "-1",
        //         "pnlUnrealised": "0",
        //         "positionId": "1111343026172067"
        //     }
        //
        // if no position exists, response will be empty
        if (response === undefined || response === null || Object.keys (response).length === 0) {
            return [];
        }
        const position = this.parsePosition (response, market);
        return [ position ];
    }

    parsePosition (position: Dict, market: Market = undefined): Position {
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "netQuantity": "5",
        //         "netExposureQuantity": "6",
        //         "netExposureNotional": "732",
        //         "entryPrice": "122",
        //         "markPrice": "122",
        //         "breakEvenPrice": "123",
        //         "estimatedLiquidationPrice": "50",
        //         "initialMarginFraction": "0.5",
        //         "maintenanceMarginFraction": "0.01",
        //         "pnlRealised": "-1",
        //         "pnlUnrealised": "0",
        //         "positionId": "1111343026172067"
        //     }
        //
        const marketId = this.safeString (position, 'symbol');
        market = this.safeMarket (marketId, market, '_');
        const contracts = this.safeNumber (position, 'netQuantity');
        const contractSize = market['contractSize'];
        const markPrice = this.safeNumber (position, 'markPrice');
        const notional = this.safeNumber (position, 'netExposureNotional');
        const side = (contracts > 0) ? 'long' : 'short';
        const absContracts = Math.abs (contracts);
        const entryPrice = this.safeNumber (position, 'entryPrice');
        const unrealizedPnl = this.safeNumber (position, 'pnlUnrealised');
        const realizedPnl = this.safeNumber (position, 'pnlRealised');
        const initialMargin = this.safeNumber (position, 'initialMarginFraction');
        const maintenanceMargin = this.safeNumber (position, 'maintenanceMarginFraction');
        const liquidationPrice = this.safeNumber (position, 'estimatedLiquidationPrice');
        // const breakEvenPrice = this.safeNumber (position, 'breakEvenPrice'); // unused
        const percentage = (entryPrice && markPrice) ? ((markPrice - entryPrice) / entryPrice) * 100 : undefined;
        const marginRatio = undefined; // TODO: calculate from collateral and notional
        return this.safePosition ({
            'id': this.safeString (position, 'positionId'),
            'symbol': market['symbol'],
            'contracts': absContracts,
            'contractSize': contractSize,
            'entryPrice': entryPrice,
            'markPrice': markPrice,
            'notional': notional,
            'initialMargin': initialMargin,
            'maintenanceMargin': maintenanceMargin,
            'unrealizedPnl': unrealizedPnl,
            'realizedPnl': realizedPnl,
            'percentage': percentage,
            'marginRatio': marginRatio,
            'liquidationPrice': liquidationPrice,
            'side': side,
            'info': position,
        });
    }

    /**
     * @method
     * @name backpack#fetchFundingRate
     * @description fetch the current funding rate for a perpetual market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_fundingRates
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [funding rate structure]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}
     */
    async fetchFundingRate (symbol: string, params = {}): Promise<FundingRate> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.publicGetFundingRates (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC_PERP",
        //             "fundingRate": "0.0001",
        //             "nextFundingTime": 1700000000000,
        //             "fundingInterval": 28800000,
        //             "upperBound": "0.02",
        //             "lowerBound": "-0.02"
        //         }
        //     ]
        //
        const result = this.safeValue (response, 0, {});
        return this.parseFundingRate (result, market);
    }

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
    async fetchFundingRateHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<FundingRateHistory[]> {
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
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
        const response = await this.wapiGetHistoryFunding (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC_PERP",
        //             "fundingRate": "0.0001",
        //             "fundingTime": 1700000000000,
        //             "payment": "0.123",
        //             "netQuantity": "100",
        //             "markPrice": "123.45"
        //         }
        //     ]
        //
        return this.parseFundingRateHistories (response, market, since, limit);
    }

    parseFundingRate (contract: string, market: Market = undefined): FundingRate {
        // Backpack specific implementation - expects a dict not a string
        const fundingRate = typeof contract === 'string' ? {} : contract;
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "fundingRate": "0.0001",
        //         "nextFundingTime": 1700000000000,
        //         "fundingInterval": 28800000,
        //         "upperBound": "0.02",
        //         "lowerBound": "-0.02"
        //     }
        //
        const marketId = this.safeString (fundingRate, 'symbol');
        const fundingTimestamp = this.safeInteger (fundingRate, 'nextFundingTime');
        // const fundingInterval = this.safeInteger (fundingRate, 'fundingInterval'); // unused
        return {
            'info': fundingRate,
            'symbol': this.safeSymbol (marketId, market, '_'),
            'markPrice': undefined,
            'indexPrice': undefined,
            'interestRate': undefined,
            'estimatedSettlePrice': undefined,
            'timestamp': undefined,
            'datetime': undefined,
            'fundingRate': this.safeNumber (fundingRate, 'fundingRate'),
            'fundingTimestamp': fundingTimestamp,
            'fundingDatetime': this.iso8601 (fundingTimestamp),
            'nextFundingRate': undefined,
            'nextFundingTimestamp': undefined,
            'nextFundingDatetime': undefined,
            'previousFundingRate': undefined,
            'previousFundingTimestamp': undefined,
            'previousFundingDatetime': undefined,
        };
    }

    parseFundingRateHistory (fundingHistory: Dict, market: Market = undefined): FundingRateHistory {
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "fundingRate": "0.0001",
        //         "fundingTime": 1700000000000,
        //         "payment": "0.123",
        //         "netQuantity": "100",
        //         "markPrice": "123.45"
        //     }
        //
        const marketId = this.safeString (fundingHistory, 'symbol');
        const timestamp = this.safeInteger (fundingHistory, 'fundingTime');
        const fundingRate = this.safeNumber (fundingHistory, 'fundingRate');
        return {
            'info': fundingHistory,
            'symbol': this.safeSymbol (marketId, market, '_'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'fundingRate': fundingRate,
        };
    }

    parseFundingRateHistories (fundingHistories, market = undefined, since: Int = undefined, limit: Int = undefined) {
        const result = [];
        for (let i = 0; i < fundingHistories.length; i++) {
            const parsed = this.parseFundingRateHistory (fundingHistories[i], market);
            result.push (parsed);
        }
        const sorted = this.sortBy (result, 'timestamp');
        return this.filterBySinceLimit (sorted, since, limit, 'timestamp');
    }

    /**
     * @method
     * @name backpack#fetchMarkPrice
     * @description fetch the mark price for a futures market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_markPrices
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary with mark price information for the market
     */
    async fetchMarkPrice (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.publicGetMarkPrices (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC_PERP",
        //             "markPrice": "123.45",
        //             "indexPrice": "123.44",
        //             "timestamp": 1700000000000
        //         }
        //     ]
        //
        const result = this.safeValue (response, 0, {});
        const markPrice = this.safeNumber (result, 'markPrice');
        // const indexPrice = this.safeNumber (result, 'indexPrice'); // unused
        const timestamp = this.safeInteger (result, 'timestamp');
        return this.safeTicker ({
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': undefined,
            'low': undefined,
            'bid': undefined,
            'bidVolume': undefined,
            'ask': undefined,
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': markPrice,
            'last': markPrice,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': undefined,
            'quoteVolume': undefined,
            'info': result,
        }, market);
    }

    /**
     * @method
     * @name backpack#fetchOpenInterest
     * @description fetch the open interest for a futures market
     * @see https://docs.backpack.exchange/#tag/Futures/operation/get_openInterest
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an open interest structure
     */
    async fetchOpenInterest (symbol: string, params = {}): Promise<OpenInterest> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.publicGetOpenInterest (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC_PERP",
        //             "openInterest": "123456",
        //             "openInterestQuote": "15432000",
        //             "timestamp": 1700000000000
        //         }
        //     ]
        //
        const result = this.safeValue (response, 0, {});
        const openInterest = this.safeNumber (result, 'openInterest');
        const openInterestValue = this.safeNumber (result, 'openInterestQuote');
        const timestamp = this.safeInteger (result, 'timestamp');
        return {
            'symbol': market['symbol'],
            'openInterestAmount': openInterest,
            'openInterestValue': openInterestValue,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'info': result,
        } as OpenInterest;
    }

    /**
     * @method
     * @name backpack#fetchBorrowRates
     * @description fetch the borrow and lend rates for a currency
     * @see https://docs.backpack.exchange/#tag/Borrow-Lend-Markets/operation/get_borrowLend_markets
     * @param {string} [code] unified currency code
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a list of borrow rate structures
     */
    async fetchBorrowRates (code: Str = undefined, params = {}): Promise<Dict> {
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['symbol'] = currency['id'];
        }
        const response = await this.publicGetBorrowLendMarkets (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "USDC",
        //             "borrowRate": "0.05",
        //             "lendRate": "0.04",
        //             "maxBorrowAmount": "1000000",
        //             "maxLendAmount": "5000000",
        //             "utilizationRate": "0.75"
        //         }
        //     ]
        //
        const rates: Dict = {};
        for (let i = 0; i < response.length; i++) {
            const rate = response[i];
            const currencyId = this.safeString (rate, 'symbol');
            const currencyCode = this.safeCurrencyCode (currencyId, currency);
            rates[currencyCode] = this.parseBorrowRate (rate, currency);
        }
        return rates;
    }

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
    async fetchBorrowRateHistory (code: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Dict[]> {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'symbol': currency['id'],
        };
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetBorrowLendMarketsHistory (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "USDC",
        //             "borrowRate": "0.05",
        //             "lendRate": "0.04",
        //             "utilizationRate": "0.75",
        //             "timestamp": 1700000000000
        //         }
        //     ]
        //
        const rates: Dict[] = [];
        for (let i = 0; i < response.length; i++) {
            rates.push (this.parseBorrowRate (response[i], currency));
        }
        return this.filterBySinceLimit (rates, since, limit, 'timestamp');
    }

    parseBorrowRate (borrowRate: Dict, currency: Currency = undefined): Dict {
        //
        //     {
        //         "symbol": "USDC",
        //         "borrowRate": "0.05",
        //         "lendRate": "0.04",
        //         "maxBorrowAmount": "1000000",
        //         "maxLendAmount": "5000000",
        //         "utilizationRate": "0.75",
        //         "timestamp": 1700000000000
        //     }
        //
        const currencyId = this.safeString (borrowRate, 'symbol');
        const timestamp = this.safeInteger (borrowRate, 'timestamp');
        return {
            'currency': currency?.['code'] || this.safeCurrencyCode (currencyId),
            'rate': this.safeNumber (borrowRate, 'borrowRate'),
            'period': 365 * 86400000, // APR in milliseconds
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'info': borrowRate,
        };
    }

    async borrowMargin (code: string, amount: number, symbol: Str = undefined, params = {}): Promise<Dict> {
        /**
         * @method
         * @name backpack#borrowMargin
         * @description create a borrow order on the exchange
         * @see https://docs.backpack.exchange/#tag/Borrow-Lend/operation/execute_borrow_lend
         * @param {string} code unified currency code of the currency to borrow
         * @param {float} amount the amount to borrow
         * @param {string} symbol not used by backpack, but kept for compatibility
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [margin loan structure]{@link https://docs.ccxt.com/#/?id=margin-loan-structure}
         */
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'symbol': currency['id'],
            'quantity': this.currencyToPrecision (code, amount),
            'side': 'Borrow',
        };
        const response = await this.privatePostBorrowLend (this.extend (request, params));
        //
        //     {
        //         // Response is usually empty on success
        //     }
        //
        return this.parseMarginLoan (response, currency);
    }

    async repayMargin (code: string, amount: Num = undefined, symbol: Str = undefined, params = {}): Promise<Dict> {
        /**
         * @method
         * @name backpack#repayMargin
         * @description repay a borrow order on the exchange
         * @see https://docs.backpack.exchange/#tag/Borrow-Lend/operation/execute_borrow_lend
         * @param {string} code unified currency code of the currency to repay
         * @param {float} amount the amount to repay
         * @param {string} symbol not used by backpack, but kept for compatibility
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [margin loan structure]{@link https://docs.ccxt.com/#/?id=margin-loan-structure}
         */
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'symbol': currency['id'],
            'quantity': this.currencyToPrecision (code, amount),
            'side': 'Lend',
        };
        const response = await this.privatePostBorrowLend (this.extend (request, params));
        //
        //     {
        //         // Response is usually empty on success
        //     }
        //
        return this.parseMarginLoan (response, currency);
    }

    parseMarginLoan (loan: Dict, currency: Currency = undefined): Dict {
        //
        // Backpack returns empty response on success for borrow/lend operations
        // We'll construct a basic response structure
        //
        const timestamp = this.milliseconds ();
        return {
            'id': undefined,
            'currency': currency?.['code'],
            'amount': undefined,
            'symbol': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'info': loan,
        };
    }

    async fetchBorrowInterest (code: Str = undefined, symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<BorrowInterest[]> {
        /**
         * @method
         * @name backpack#fetchBorrowInterest
         * @description fetch the interest owed by the user for borrowing currency for margin trading
         * @see https://docs.backpack.exchange/#tag/History/operation/get_interest_history
         * @param {string} code unified currency code
         * @param {string} symbol not used by backpack, but kept for compatibility
         * @param {int} [since] the earliest time in ms to fetch interest history for
         * @param {int} [limit] the maximum number of structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [borrow interest structures]{@link https://docs.ccxt.com/#/?id=borrow-interest-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['symbol'] = currency['id'];
        }
        if (since !== undefined) {
            request['from'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetHistoryInterest (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "123456789",
        //             "symbol": "USDC",
        //             "side": "Borrow",
        //             "amount": "0.05",
        //             "timestamp": 1700000000000
        //         }
        //     ]
        //
        return this.parseBorrowInterests (response, undefined);
    }

    parseBorrowInterests (borrowInterests: Dict[], market = undefined): BorrowInterest[] {
        const result: BorrowInterest[] = [];
        for (let i = 0; i < borrowInterests.length; i++) {
            result.push (this.parseBorrowInterest (borrowInterests[i], market));
        }
        return result;
    }

    parseBorrowInterest (info: Dict, market = undefined): BorrowInterest {
        //
        //     {
        //         "id": "123456789",
        //         "symbol": "USDC",
        //         "side": "Borrow",
        //         "amount": "0.05",
        //         "timestamp": 1700000000000
        //     }
        //
        const currencyId = this.safeString (info, 'symbol');
        const timestamp = this.safeInteger (info, 'timestamp');
        return {
            'symbol': undefined,
            'marginMode': 'cross',
            'currency': this.safeCurrencyCode (currencyId),
            'interest': this.safeNumber (info, 'amount'),
            'interestRate': undefined,
            'amountBorrowed': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'info': info,
        };
    }

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
    async fetchDepositAddress (code: string, params = {}): Promise<DepositAddress> {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'blockchain': currency['id'],
        };
        // check if network parameter is provided
        const networkId = this.safeString (params, 'network');
        if (networkId !== undefined) {
            params = this.omit (params, 'network');
            const networks = this.safeValue (currency, 'networks', {});
            const network = this.safeValue (networks, networkId, {});
            request['blockchain'] = this.safeString (network, 'id', networkId);
        }
        const response = await this.wapiGetCapitalDepositAddress (this.extend (request, params));
        //
        //     {
        //         "address": "0x1234567890abcdef1234567890abcdef12345678",
        //         "blockchain": "Ethereum",
        //         "memo": null
        //     }
        //
        return this.parseDepositAddress (response, currency);
    }

    parseDepositAddress (depositAddress: Dict, currency: Currency = undefined): DepositAddress {
        //
        //     {
        //         "address": "0x1234567890abcdef1234567890abcdef12345678",
        //         "blockchain": "Ethereum",
        //         "memo": null
        //     }
        //
        const address = this.safeString (depositAddress, 'address');
        const tag = this.safeString (depositAddress, 'memo');
        const networkId = this.safeString (depositAddress, 'blockchain');
        this.checkAddress (address);
        return {
            'currency': currency?.['code'],
            'address': address,
            'tag': tag,
            'network': this.networkIdToCode (networkId),
            'info': depositAddress,
        };
    }

    async fetchTradingFees (params = {}): Promise<TradingFees> {
        /**
         * @method
         * @name backpack#fetchTradingFees
         * @description fetch the trading fees for a market
         * @see https://docs.backpack.exchange/#tag/Account/operation/get_account
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [fee structure]{@link https://docs.ccxt.com/#/?id=fee-structure}
         */
        await this.loadMarkets ();
        const response = await this.privateGetAccount (params);
        //
        //     {
        //         "autoBorrowSettlements": true,
        //         "autoLend": true,
        //         "autoRealizePnl": true,
        //         "autoRepayBorrows": true,
        //         "borrowLimit": "10000",
        //         "futuresMakerFee": "5",
        //         "futuresTakerFee": "10",
        //         "leverageLimit": "20",
        //         "limitOrders": 0,
        //         "liquidating": false,
        //         "positionLimit": "100000",
        //         "spotMakerFee": "0",
        //         "spotTakerFee": "20",
        //         "triggerOrders": 0
        //     }
        //
        const spotMakerString = this.safeString (response, 'spotMakerFee');
        const spotTakerString = this.safeString (response, 'spotTakerFee');
        const futuresMakerString = this.safeString (response, 'futuresMakerFee');
        const futuresTakerString = this.safeString (response, 'futuresTakerFee');
        // Convert basis points to decimal (divide by 10000)
        const spotMaker = this.parseNumber (Precise.stringDiv (spotMakerString, '10000'));
        const spotTaker = this.parseNumber (Precise.stringDiv (spotTakerString, '10000'));
        const futuresMaker = this.parseNumber (Precise.stringDiv (futuresMakerString, '10000'));
        const futuresTaker = this.parseNumber (Precise.stringDiv (futuresTakerString, '10000'));
        const result: Dict = {
            'trading': {
                'maker': spotMaker,
                'taker': spotTaker,
            },
        };
        // Add futures fees if they exist
        if ((futuresMakerString !== undefined) || (futuresTakerString !== undefined)) {
            result['futures'] = {
                'maker': futuresMaker,
                'taker': futuresTaker,
            };
        }
        return result;
    }

    async fetchSettlementHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name backpack#fetchSettlementHistory
         * @description fetch settlement history for dated futures
         * @see https://docs.backpack.exchange/#tag/History/operation/get_settlementHistory
         * @param {string} symbol unified market symbol
         * @param {int} [since] timestamp in ms of the earliest settlement
         * @param {int} [limit] max number of settlements to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [settlement history objects]
         */
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetHistorySettlement (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "BTC_USDC_20240329",
        //             "settlementPrice": "69420.50",
        //             "settlementTime": "1711728000000",
        //             "quantity": "0.5",
        //             "pnl": "1250.25",
        //             "fee": "12.50"
        //         }
        //     ]
        //
        return this.parseSettlements (response, market, since, limit);
    }

    parseSettlement (settlement, market = undefined) {
        //
        //     {
        //         "symbol": "BTC_USDC_20240329",
        //         "settlementPrice": "69420.50",
        //         "settlementTime": "1711728000000",
        //         "quantity": "0.5",
        //         "pnl": "1250.25",
        //         "fee": "12.50"
        //     }
        //
        const marketId = this.safeString (settlement, 'symbol');
        const timestamp = this.safeInteger (settlement, 'settlementTime');
        return {
            'info': settlement,
            'symbol': this.safeSymbol (marketId, market),
            'price': this.safeNumber (settlement, 'settlementPrice'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'quantity': this.safeNumber (settlement, 'quantity'),
            'pnl': this.safeNumber (settlement, 'pnl'),
            'fee': this.safeNumber (settlement, 'fee'),
        };
    }

    parseSettlements (settlements, market = undefined, since: Int = undefined, limit: Int = undefined) {
        const result = [];
        for (let i = 0; i < settlements.length; i++) {
            result.push (this.parseSettlement (settlements[i], market));
        }
        const sorted = this.sortBy (result, 'timestamp');
        return this.filterBySinceLimit (sorted, since, limit);
    }

    async fetchPnlHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name backpack#fetchPnlHistory
         * @description fetch realized PnL history
         * @see https://docs.backpack.exchange/#tag/History/operation/get_pnlHistory
         * @param {string} symbol unified market symbol
         * @param {int} [since] timestamp in ms of the earliest PnL entry
         * @param {int} [limit] max number of PnL entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [pnl history objects]
         */
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.wapiGetHistoryPnl (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "SOL_USDC_PERP",
        //             "pnl": "125.50",
        //             "timestamp": "1703123456789",
        //             "side": "Buy",
        //             "quantity": "10",
        //             "price": "100.50",
        //             "fee": "1.25"
        //         }
        //     ]
        //
        return this.parsePnlHistory (response, market, since, limit);
    }

    parsePnl (pnl, market = undefined) {
        //
        //     {
        //         "symbol": "SOL_USDC_PERP",
        //         "pnl": "125.50",
        //         "timestamp": "1703123456789",
        //         "side": "Buy",
        //         "quantity": "10",
        //         "price": "100.50",
        //         "fee": "1.25"
        //     }
        //
        const marketId = this.safeString (pnl, 'symbol');
        const timestamp = this.safeInteger (pnl, 'timestamp');
        return {
            'info': pnl,
            'symbol': this.safeSymbol (marketId, market),
            'pnl': this.safeNumber (pnl, 'pnl'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'side': this.safeStringLower (pnl, 'side'),
            'quantity': this.safeNumber (pnl, 'quantity'),
            'price': this.safeNumber (pnl, 'price'),
            'fee': this.safeNumber (pnl, 'fee'),
        };
    }

    parsePnlHistory (pnls, market = undefined, since: Int = undefined, limit: Int = undefined) {
        const result = [];
        for (let i = 0; i < pnls.length; i++) {
            result.push (this.parsePnl (pnls[i], market));
        }
        const sorted = this.sortBy (result, 'timestamp');
        return this.filterBySinceLimit (sorted, since, limit);
    }

    async createStopLossOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, stopPrice: number, price: Num = undefined, params = {}) {
        /**
         * @method
         * @name backpack#createStopLossOrder
         * @description create a stop loss order
         * @see https://docs.backpack.exchange/#tag/Order/operation/create_order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much you want to trade in units of base currency
         * @param {float} stopPrice the price at which the stop order is triggered
         * @param {float} [price] the price for the limit order
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.triggerType] 'mark' or 'last' (default is 'last')
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (type === 'market') {
            // For market stop-loss orders, price is not required
            return await this.createOrder (symbol, 'STOP_MARKET', side, amount, undefined, {
                'triggerPrice': stopPrice,
                ...params,
            });
        } else {
            // For limit stop-loss orders, price is required
            if (price === undefined) {
                throw new ArgumentsRequired (this.id + ' createStopLossOrder() requires a price argument for limit orders');
            }
            return await this.createOrder (symbol, 'STOP_LIMIT', side, amount, price, {
                'triggerPrice': stopPrice,
                ...params,
            });
        }
    }

    async createTakeProfitOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, takeProfitPrice: number, price: Num = undefined, params = {}) {
        /**
         * @method
         * @name backpack#createTakeProfitOrder
         * @description create a take profit order
         * @see https://docs.backpack.exchange/#tag/Order/operation/create_order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much you want to trade in units of base currency
         * @param {float} takeProfitPrice the price at which the take profit order is triggered
         * @param {float} [price] the price for the limit order
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.triggerType] 'mark' or 'last' (default is 'last')
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (type === 'market') {
            // For market take-profit orders, price is not required
            return await this.createOrder (symbol, 'TAKE_PROFIT_MARKET', side, amount, undefined, {
                'triggerPrice': takeProfitPrice,
                ...params,
            });
        } else {
            // For limit take-profit orders, price is required
            if (price === undefined) {
                throw new ArgumentsRequired (this.id + ' createTakeProfitOrder() requires a price argument for limit orders');
            }
            return await this.createOrder (symbol, 'TAKE_PROFIT_LIMIT', side, amount, price, {
                'triggerPrice': takeProfitPrice,
                ...params,
            });
        }
    }
}
