'use strict';

module.exports = class ico_module {

    constructor(market, rateLimit = 1000, __verbose = true, __display_on_table = true, __enable_ansicolor = false, __default_timeFrame = '1h') {
        this.ccxt_quiker = require('./ccxt_quiker.js');
        this.time_tools = require('./time_tools.js');
        this.asTable = require('as-table').configure({ delimiter: ' | ' });
        this.version = 'v 0.2.4 beta';
        this._ = require('lodash');
        this.ansi = require('ansicolor');
        this.time_t = new this.time_tools();

        this.isVerbose = __verbose;
        this.display_on_table = __display_on_table;

        // variable declaration
        this.exchange = market;
        this.ccxt_exchange = new this.ccxt_quiker(this.exchange);
        this.rateLimit = rateLimit;

        this.default_timeFrame = __default_timeFrame;
        this.icoPrincingList = [];
        this.marketInformations = [];
        this.marketCurrenciesList = [];
        this.icoAnalyses = [];

        if (this.isVerbose) {
            console.log('[ * ] - Exchange: ' + this.exchange + ' Rate Limit: ' + rateLimit);
        }
    }

    getExchange() {
        return this.exchange;
    }

    getCurrenciesPricingList() {
        return this.icoPrincingList;
    }

    getMarketInformations() {
        return this.marketInformations;
    }

    getRateLimit() {
        return this.rateLimit;
    }

    getBaseCurriencies() {}

    getCurrenciesList() {
        return this.marketCurrenciesList;
    }

    setRateLimit(__ratelimit_ms) {
        this.rateLimit = __ratelimit_ms;
        return this.rateLimit;
    }

    enableVerbose() {}

    enableAutoTableDisplay() {}

    enableAnsiColor() {}

    resetExchange(__exchange_id, rateLimit = 1000) {
        this.exchange = __exchange_id;
        this.ccxt_exchange = new this.ccxt_quiker(this.exchange);
        return this.exchange;
    }

    async badge(position, _timeStamp, open, close, high, low, volume) {
        /*
        Candlestick Patterns
           D1               D2                  D3                   D4                  D5                  D6

            |                                    |                    |                                                          <----- High
            |                |                   |                    |
           +-+              +-+                 +-+                  +-+                 +-+                 +-+                 <----- Open
           | |              | |                 | |                  | |                 | |                 | |
           | |              | |                 | |                  | |                 | |                 | |
           | |              | |                 | |                  | |                 | |                 | |
           +-+              +-+                 +-+                  +-+                 +-+                 +-+                 <----- Close
            |                |                   |                                        |
            |                |                                                            |                                      <----- Low
        */
        let feed_data = {
            position: position,
            timestamp: _timeStamp,
            time: this.time_t.epoch_smart_date_time(_timeStamp),
            open: open,
            close: close,
            high: high,
            low: low,
            volume: volume,
            symbol: undefined,
            gain: undefined,
            loss: undefined,
            avg_gain: undefined,
            avg_loss: undefined,
            RS: undefined,
            RSI: undefined
        };
        let ho, hc, cl, ol, stagnation, hs, sl;
        if (open > close) {
            // open superior to close ==> closed low (down)
            if (high > open && low < close) {
                // D1 or D2 or D3
                ho = high - open;
                cl = close - low;
                if (ho === cl) {
                    // D1
                    feed_data.symbol = 'D1';
                }
                if (ho < cl) {
                    // D2
                    feed_data.symbol = 'D2';
                }
                if (ho > cl) {
                    // D3
                    feed_data.symbol = 'D3';
                }
            } else if (low === close && high > open) {
                // D4
                feed_data.symbol = 'D4';
            } else if (high === open && low < close) {
                // D5
                feed_data.symbol = 'D5';
            } else if (high === open && low === close) {
                // D6
                feed_data.symbol = 'D6';
            }
        }

        /*
        Candlestick Patterns
        U1               U2                  U3                   U4                  U5                  U6

            |                                    |                    |                                                     <----- High
            |                |                   |                    |
           +-+              +-+                 +-+                  +-+                 +-+                 +-+            <----- Close
           | |              | |                 | |                  | |                 | |                 | |
           | |              | |                 | |                  | |                 | |                 | |
           | |              | |                 | |                  | |                 | |                 | |
           +-+              +-+                 +-+                  +-+                 +-+                 +-+            <----- Open
            |                |                   |                                        |
            |                |                                                            |                                 <----- Low
        */

        if (open < close) {
            // open inferior to close ===> closed high (up)
            if (high > close && low < open) {
                // U1 or U2 or U3
                hc = high - close;
                ol = open - low;
                if (hc === ol) {
                    // U1
                    feed_data.symbol = 'U1';
                }
                if (hc < ol) {
                    // U2
                    feed_data.symbol = 'U2';
                }
                if (hc > ol) {
                    // U3
                    feed_data.symbol = 'U3';
                }
            } else if (low === open && high > close) {
                // U4
                feed_data.symbol = 'U4';
            } else if (high === close && low < open) {
                // U5
                feed_data.symbol = 'U5';
            } else if (high === close && low === open) {
                // U6
                feed_data.symbol = 'U6';
            }
        }
        /*
        Candlestick Pattern
        S1             S2                S3              S4                S5            S6

            |                               |               |                                                 <----- High
            |                               |               |
            |                               |               |
            |             |                 |               |
          __|__         __|__             __|__           __|__             _____          _____               <----- Open and close
            |             |                 |                                 |
            |             |                 |                                 |
            |             |                                                   |
            |             |                                                   |                                 <----- Low
        */

        if (open === close) {
            // open equal to close ===> closed in same value (stable)
            stagnation = open;
            if (high > stagnation && low < stagnation) {
                // S1 or S2 or S3
                hs = high - stagnation;
                sl = stagnation - low;
                if (hs === sl) {
                    // S1
                    feed_data.symbol = 'S1';
                }
                if (hs < sl) {
                    // S2
                    feed_data.symbol = 'S2';
                }
                if (hs > sl) {
                    // S3
                    feed_data.symbol = 'S3';
                }
            } else if (low === stagnation && high > stagnation) {
                // S4
                feed_data.symbol = 'S4';
            } else if (high === stagnation && low < stagnation) {
                // S5
                feed_data.symbol = 'S5';
            } else if (high === stagnation && low === stagnation) {
                // S6
                feed_data.symbol = 'S6';
            }
        }
        return feed_data;
    }

    async convert2symbol_format(_feed_source) {
        let _new_symbolized = [];
        let _feed_data = {};
        let __series = _feed_source.length;
        return new Promise((resolve, reject) => {
            for (let i = 0; i < __series; i++) {
                let _timeStamp = _feed_source[i][0],
                    _open = _feed_source[i][1],
                    _close = _feed_source[i][4],
                    _high = _feed_source[i][2],
                    _low = _feed_source[i][3],
                    _volume = _feed_source[i][5];
                let _before_close, _change_result,
                    _feed_data = this.badge(i, _timeStamp, _open, _close, _high, _low, _volume);
                if (i === 0) {
                    _feed_data.gain = 0;
                    _feed_data.loss = 0;
                } else {
                    _before_close = _feed_source[i - 1][4];
                    _change_result = (_close - _before_close).toFixed(8) / 1;
                    if (_change_result >= 0) {
                        _feed_data.gain = (_change_result === 0) ? 0 : _change_result;
                        _feed_data.loss = 0;
                    } else if (_change_result < 0) {
                        _feed_data.gain = 0;
                        _feed_data.loss = _change_result * -1;
                    }
                }
                _new_symbolized.push(_feed_data);
            }
            resolve(_new_symbolized);
        });
    }

    async last_seq(symbolized, lastOne = 1) {
        let last_sequances = [];
        for (let i = (symbolized.length - lastOne); i < symbolized.length; i++) {
            last_sequances.push(symbolized[i]);
        }
        return last_sequances;
    }

    async make_rsi(__feed_core, __period = 14) {
        let __feed_rsi = [];
        let seq = __feed_core.length;
        //let __eat_feed = {};
        let loss_sum = 0;
        let gain_sum = 0;
        let counter = 0;
        for (let i = __period; i < seq; i++) {
            //__eat_feed = __feed_core[i];
            loss_sum = 0;
            gain_sum = 0;
            counter = 0;
            for (let y = (i - __period); y < i; y++) {
                loss_sum += __feed_core[y].loss.toFixed(8) / 1;
                gain_sum += __feed_core[y].gain.toFixed(8) / 1;
                counter += 1;
            }
            __feed_core[i].avg_loss = (loss_sum / __period).toFixed(8) / 1;
            __feed_core[i].avg_gain = (gain_sum / __period).toFixed(8) / 1;
            __feed_core[i].RS = ((__feed_core[i].avg_gain / __feed_core[i].avg_loss).toFixed(4)) / 1;
            __feed_core[i].RSI = ((100 - (100 / (1 + __feed_core[i].RS))).toFixed(2)) / 1;
            __feed_rsi.push(__feed_core[i]);
        }
        return __feed_rsi;
    }

    async rsi_analyses(__feed_seq, __onlyLast = false) {

        let __feed_seq_size = __feed_seq.length;
        let __feed_seq_midel_size = Math.floor(__feed_seq.length / 2);

        if (__onlyLast) {
            return {
                last_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_size - 2].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
                last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
            };
        } else {
            return {
                full_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[0].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
                middle_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_midel_size].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
                last_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_size - 2].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
                full_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[0].timestamp),
                middle_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_midel_size].timestamp),
                last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
            };
        }

    }

    async ms_2period_human(__first, __last) {
      return new Promise((resolve, reject) => {
        let __begin = 0;
        let __end = 0;
        let __period = 0;
        if (__first > __last) {
            __begin = __first;
            __end = __last;
        } else {
            __begin = __last;
            __end = __first;
        }
        __period = (__begin - __end) / 1000; // period in seconds
        if (__period <= 59) {
            resolve( __period.toFixed(2) + ' seconds');
        }

        if (__period >= 60 && __period < 3600) {
            // 3600 = 60m * 60s
            resolve( (__period / 60).toFixed(2) + ' minutes');
        }

        if (__period >= 3600 && __period < 86400) {
            // 86400 = 24h * 60m * 60s
            resolve( ((__period / 60) / 60).toFixed(2) + ' hours');
        }

        if (__period >= 86400) {
            // 86400 = 24h * 1d
            resolve( (((__period / 24) / 60) / 60).toFixed(2) + ' days');
        }
      });

    }

    async LoadMarketCurrencies() {
        this.marketCurrenciesList = await this.ccxt_exchange.get_markets_list();
        if (this.isVerbose) {
            console.log(' [**] Load market : ' + this.exchange + '  ' + this.marketCurrenciesList.length + ' currencies in the list.')
        }
        return this.marketCurrenciesList;
    }

    async LoadCurrenciesPricingList(__ansi_color = false) {
        let ico_pricing = await this.ccxt_exchange.prices_currencies();
        this._.each(ico_pricing, (__data, __key) => {
            if (__ansi_color) {
                this.icoPrincingList.push({
                    Market: (__data.ask >= __data.high) ? this.ansi.bgBlue(__key) : (__data.ask <= __data.low) ? this.ansi.red(__key) : this.ansi.yellow(__key),
                    TimeStamp: this.time_t.smart_date_time(__data.datetime),
                    High: (__data.ask > __data.high) ? this.ansi.bgBlue(__data.high) : (__data.bid <= __data.low) ? this.ansi.bgRed(__data.high) : __data.high,
                    Low: __data.low,
                    Last: (__data.last <= __data.low) ? this.ansi.red(__data.last) : (__data.last >= __data.high) ? this.ansi.green(__data.last) : this.ansi.yellow(__data.last),
                    Volume: __data.quoteVolume,
                    BaseVolume: __data.baseVolume,
                    Bid: (__data.bid <= __data.low) ? this.ansi.red(__data.bid) : this.ansi.yellow(__data.bid),
                    Ask: (__data.ask >= __data.last) ? this.ansi.green(__data.ask) : (__data.ask >= __data.low) ? this.ansi.yellow(__data.ask) : this.ansi.lightRed(__data.ask),
                    'Will go': ((__data.ask >= __data.last)) ? this.ansi.green('UP') : this.ansi.red('Down')
                });
            } else {
                this.icoPrincingList.push({
                    Market: __key,
                    TimeStamp: this.time_t.smart_date_time(__data.datetime),
                    High: __data.high,
                    Low: __data.low,
                    Last: __data.last,
                    Volume: __data.quoteVolume,
                    BaseVolume: __data.baseVolume,
                    Bid: __data.bid,
                    Ask: __data.ask,
                    'Will go': ((__data.ask >= __data.last)) ? 'UP' : 'Down'
                });
            }
        });
        if (this.display_on_table) {
            console.log(this.asTable(this.icoPrincingList));
        }
        return this.icoPrincingList;
    }

    async LoadMarketInformations() {
        let markets_info = await this.ccxt_exchange.load_markets();
        //console.dir(markets_info);
        this._.each(markets_info, (__data, __key) => {
            this.marketInformations.push({
                Base: __data.base,
                Quote: __data.quote,
                Market: __data.symbol,
                isActive: __data.info.IsActive,
                Created: __data.info.Created,
                Notice: __data.info.Notice
            });
        });

        if (this.display_on_table) {
            console.log(this.asTable(this.marketInformations));
        }
        return this.marketInformations;
    }
/*
    async volume_analyses(__feed_seq, __onlyLast = false) {
        let __feed_seq_size = __feed_seq.length;
        let __feed_seq_midel_size = Math.floor(__feed_seq.length / 2);
        return new Promise((resolve, reject) => {
            if (__onlyLast) {
                resolve({
                    last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
                });
            } else {
                resolve({
                    full_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[0].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    middle_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_midel_size].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    full_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[0].timestamp),
                    middle_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_midel_size].timestamp),
                    last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
                });
            }
        });
    }
*/

    async volume_analyses(__feed_seq, __onlyLast = false) {
        let __feed_seq_size = __feed_seq.length;
        let __feed_seq_midel_size = Math.floor(__feed_seq.length / 2);

            if (__onlyLast) {
                return {
                    last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
                };
            } else {
                return {
                    full_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[0].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    middle_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_midel_size].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
                    full_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[0].timestamp),
                    middle_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_midel_size].timestamp),
                    last_period: this.ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
                };
            }
    }

    async getSeqanceTrend(__feed_seq) {
      return new Promise((resolve, reject) => {
        let __feed_seq_size = __feed_seq.length;
        let trend = undefined; // variable / up / down
        let __up = 0;
        let __down = 0;
        let __stable = 0;
        let __grow = 0;
        let __decline = 0;
        let __status = '---';

        for (let i = 0; i < __feed_seq_size - 1; i++) {
            if (__feed_seq[i].close > __feed_seq[i + 1].close) { // up trend
                __up += 1;
                __grow += (Math.abs((__feed_seq[i + 1].close - __feed_seq[i].close) / __feed_seq[i + 1].close)).toFixed(2) / 1;
            } else if (__feed_seq[i].close < __feed_seq[i + 1].close) { // down trend
                __down += 1;
                __decline += (Math.abs((__feed_seq[i + 1].close - __feed_seq[i].close) / __feed_seq[i + 1].close)).toFixed(2) / 1;
            } else if (__feed_seq[i].close === __feed_seq[i + 1].close) {
                __stable += 1;
            }
        }

        if (__grow > __decline) {
            __status = 'up';
        }

        if (__grow < __decline) {
            __status = 'down';
        }

        if (__grow === __decline) {
            __status = 'stable';
        }

        //return '__up: ' + __up + ' __down: ' + __down + ' __stable: ' + __stable + ' __grow: ' + __grow + ' __decline: ' + __decline;
        resolve({
            up_sequances: __up,
            down_sequances: __down,
            stable_sequances: __stable,
            sequance: __feed_seq_size - 1,
            grow: __grow,
            decline: __decline,
            variation: __grow - __decline,
            grow_percent: __grow * 100,
            decline_percent: __decline * 100,
            variation_percent: (__grow - __decline) * 100,
            status: __status
        });
      });
    }

    async candle_predict(__feed_analyse, __seq = 10) {
        let __feed_size = __feed_analyse.length;
        let compare = '';
        let __new_feed = [];

        //
        // 01/32  DOWN  OK
        // 02/32  DOWN  OK
        // 03/32  DOWN  OK
        // 04/32  DOWN  OK
        // 05/32  DOWN  OK -- need more analyses thinks
        // 06/32  DOWN  OK
        // 07/32  DOWN  OK
        // 08/32  DOWN  -- need more analyses thinks
        // 09/32  DOWN  OK
        // 10/32  DOWN  -- need more analyses thinks
        // 11/32  DOWN  OK
        // 12/32  DOWN  OK -- need more analyses thinks
        // 13/32  DOWN  OK -- need more analyses thinks for the candlestick at the position +2 and -2
        // 14/32  DOWN  OK -- hidden (need more analyses thinks)
        // 15/32  DOWN  OK
        // 16/32  DOWN  OK
        //
        // 17/32  UP
        // 18/32  UP    OK
        // 19/32  UP    OK
        // 20/32  UP    OK
        // 21/32  UP    OK
        // 22/32  UP    OK
        // 23/32  UP    OK
        // 24/32  UP    -- need more analyses thinks
        // 25/32  UP    OK
        // 26/32  UP    -- need more analyses thinks
        // 27/32  UP    OK
        // 28/32  UP    OK
        // 29/32  UP    --
        // 30/32  UP    OK -- hidden (need more analyses thinks)
        // 31/32  UP    OK
        // 32/32  UP    OK
        //

        // bullish => move up trend
        // bearish => move down trend

        let trend = 'N/A';

        for (let i = 4; i < __feed_size; i++) {

            /**
             * http://www.investopedia.com/articles/active-trading/092315/5-most-powerful-candlestick-patterns.asp
             * 1 - Three Line Strike  (Go UP) - 84%
             * 2 - Two Black Gapping (Go DOWN) - 68%
             * 3 - Three Black Crows (Go DOWN) - 78%
             * 4 - Evening Star (Go DOWN) - 72%
             * 5 - Abandoned Baby (Go UP) - 70%
             */

            // 1 - Three Line Strike  (Go UP) - 84% [D/D/D/U] (up trend)
            if (__feed_analyse[i].symbol.match(/U/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/D/)) {
                if (__feed_analyse[i].close > __feed_analyse[i - 3].open && __feed_analyse[i].open < __feed_analyse[i - 1]) {
                    // Up candel must be big than three candles before
                    if (__feed_analyse[i - 3].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1] && __feed_analyse[i - 3].close > __feed_analyse[i - 2].close && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close) {
                        // the three candles before the big UP candle must be in down trend
                        console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Line Strike) market can go up (84%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        trend = 'Go Up 84%';
                    }
                }
            }

            // 2 - Two Black Gapping (Go DOWN) - 68%  [U/D/D/D] (down trend)
            if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                if (__feed_analyse[i - 3].close >= __feed_analyse[i - 2].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].open && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                    console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Two Black Gapping) market can go down (68%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    trend = 'Go Down 68%';
                }
                // 3 - Three Black Crows (Go DOWN) - 78%
                if (__feed_analyse[i - 3].close < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                    console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Black Crows) market can go down (78%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    trend = 'Go Down 78%';
                }
            }

            // 4 - Evening Star (Go DOWN) - 72%
            if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                if (__feed_analyse[i - 2].close < __feed_analyse[i - 1].close && __feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                    console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Evening Star) market can go down (72%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    trend = 'Go Down 72%';
                }
            }

            // 5 - Abandoned Baby (Go UP) - 70%   [D/S(1,2,5)/U]
            if (__feed_analyse[i].symbol.match(/U/) && (__feed_analyse[i - 1].symbol === 'S1' || __feed_analyse[i - 1].symbol === 'S2' || __feed_analyse[i - 1].symbol === 'S5') && __feed_analyse[i - 2].symbol.match(/D/)) {
                if (__feed_analyse[i - 2].close >= __feed_analyse[i - 1].open && __feed_analyse[i].open >= __feed_analyse[i - 1].open) {
                    console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Abandoned Baby) market can go up (70%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    trend = 'Go Up 70%';
                }
            }

            /**
             * END OF NEW DEFINITION
             */

            if ((__feed_analyse[i].close === __feed_analyse[i - 1].open || __feed_analyse[i].close === __feed_analyse[i - 1].close) && (__feed_analyse[i].open === __feed_analyse[i - 1].open || __feed_analyse[i].open === __feed_analyse[i - 1].close)) {
                // identical candle in size
                if ((__feed_analyse[i - 2].symbol === 'U5' || __feed_analyse[i - 2].symbol === 'S5') && (__feed_analyse[i - 2].close === __feed_analyse[i - 1].open || __feed_analyse[i - 2].close === __feed_analyse[i - 1].close)) {
                    console.log('[16/32] detected suite: (Hanging Man [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 16/32 - Hanging Man [Bar confirm]
                }

                if (__feed_analyse[i - 2].symbol === 'U4' && __feed_analyse[i - 3].symbol === 'D4' && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                    console.log('[12/32] detected suite: (Inverted Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 12/32 - Inverted Hammer [Bar confirm]
                }

                if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                    // maybe need revision ... no i'm sure that need revision
                    if ((__feed_analyse[i - 2].open < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 2].close) || (__feed_analyse[i - 2].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open < __feed_analyse[i - 2].close)) {
                        console.log('[27/32] detected suite: (On-Neck Line [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                        // 27/32 - On-Neck Line [Bar confirm]
                    }
                }

                /*  See revision of this situation -- need deleted when all is ok
                if (__feed_analyse[i - 2].symbol === 'D5') {
                    console.log('[32/32] detected suite: (Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 32/32 - Hammer [Bar confirm]
                }
                */
            }

            if ((__feed_analyse[i].close > __feed_analyse[i - 1].open || __feed_analyse[i].close > __feed_analyse[i - 1].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
                // Up trend position 0 and position -1
                if (__feed_analyse[i - 2].symbol === 'S1' && __feed_analyse[i - 3].symbol.match(/U/)) {
                    if (__feed_analyse[i - 2].open < __feed_analyse[i - 3].close && __feed_analyse[i - 2].open > __feed_analyse[i - 3].open) {
                        console.log('[19/32] detected suite: (Bullish Harami Cross) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 19/32  - Bullish Harami Cross
                    }
                }
            }


            if (__feed_analyse[i].symbol.match(/U/)) {
                if (__feed_analyse[i].symbol === 'U1') {
                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                        console.log('[09/32] detected suite: (Separating Line Bearish) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 09/32 Separating Line Bearish
                    }

                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D1') {
                        if (__feed_analyse[i].open < __feed_analyse[i - 1].open && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open && __feed_analyse[i - 1].close < __feed_analyse[i - 2].close && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                            console.log('[20/32] detected suite: (Pricing Line [Bar confirm]) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 20/32 Separating Line Bearish
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].open === __feed_analyse[i - 1].high) {
                        if ((__feed_analyse[i - 2].close > __feed_analyse[i - 3].open || __feed_analyse[i - 2].close > __feed_analyse[i - 3].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
                            console.log('[21/32] detected suite: (Engulting Bullish Line) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 21/32 - Engulting Bullish Line
                        }


                    }

                    if (__feed_analyse[i - 1].symbol === 'S1' && __feed_analyse[i - 2].symbol === 'D1') {
                        if (__feed_analyse[i - 1].open < __feed_analyse[i - 1].close && __feed_analyse[i - 1].open < __feed_analyse[i].open && __feed_analyse[i - 2].open > __feed_analyse[i].close) {
                            console.log('[22/32] detected suite: (Morning Doji Star) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 22/32 - Morning doji star
                        }
                    }
                }

                if (__feed_analyse[i].symbol === 'U2') {
                    if ((__feed_analyse[i].open - __feed_analyse[i].low) > (__feed_analyse[i].close - __feed_analyse[i].open) * 20) {
                        console.log('[30/32] detected suite: (Long Lower Shadow) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 30/32 - Long Lower Shadow
                    }

                }

                if (__feed_analyse[i].symbol === 'U3') {

                }

                if (__feed_analyse[i].symbol === 'U4') {

                }

                if (__feed_analyse[i].symbol === 'U5') {
                    if (__feed_analyse[i - 1].symbol === 'U4' && __feed_analyse[i - 2].symbol === 'U5') {
                        if (__feed_analyse[i - 1].close === __feed_analyse[i].open && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                            console.log('[11/32] detected suite: (Bullish Soldier) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 11/32  3 Bullish Soldier
                        }
                    }
                }

                if (__feed_analyse[i].symbol === 'U6') {

                }

            }


            if (__feed_analyse[i].symbol.match(/D/)) {

                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].high < __feed_analyse[i - 1].close && __feed_analyse[i - 1].low > __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 2].high < __feed_analyse[i - 1].close && __feed_analyse[i - 2].close < __feed_analyse[i - 1].low) {
                        console.log('[02/32] detected suite: (Bearish harami) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 02/32 Bearish harami  * Look like ok
                    }
                }

                /**
                 * Bearish Hammer - Shooting Star
                 */
                if (__feed_analyse[i - 1].symbol === 'D3' || __feed_analyse[i].symbol === 'D3') {
                    if (__feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                        console.log('[**] detected suite: (Bearish Hammer - Shooting Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // Bearish Hammer - Shooting Star
                    }
                }


                if (__feed_analyse[i].symbol === 'D1') {
                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i].open > __feed_analyse[i - 1].open && __feed_analyse[i].open < __feed_analyse[i - 1].close) {
                            if (__feed_analyse[i - 1].close > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open) {
                                console.log('[04/32] detected suite: (Dark Cloud Cover [Bar confirm]) market can go down from the sequance : ' + __feed_analyse[i].position);
                                // 04/32 - Dark Cloud Cover [Bar confirm]
                            }
                        }

                        if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'U1') {
                            if (__feed_analyse[i].close === __feed_analyse[i - 1].open && __feed_analyse[i - 2].open === __feed_analyse[i - 1].open) {
                                console.log('[23/32] detected suite: (Morning Star) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                                // 23/32 - Morning Star
                            }
                        }

                        if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                            console.log('[25/32] detected suite: (Separating Line Bullish) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                            // 25/32 - Separating Line Bullish
                        }


                    }

                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D2' && __feed_analyse[i - 3].symbol === 'D1') {
                        if (__feed_analyse[i].low === __feed_analyse[i - 1].low && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                            console.log('[31/32] detected suite: (Tweezer Bottoms) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                            // 31/32 - Tweezer Bottoms
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i].open < __feed_analyse[i - 1].close && __feed_analyse[i].close > __feed_analyse[i - 1].open) {
                            console.log('[02/32] detected suite: (Bullish Harami) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                            // 02/32 - Bullish Harami
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/S/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].open > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                            console.log('[06/32] detected suite: (Evening Doji Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 06/32 - Evening Doji Star
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].open === __feed_analyse[i].open && __feed_analyse[i - 2].close === __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                            console.log('[07/32] detected suite: (Evening Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 07/32 - Evening Star
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D2') {
                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/) && __feed_analyse[i - 3].symbol.match(/U/) && __feed_analyse[i - 4].symbol.match(/D/)) {
                        if (__feed_analyse[i].open > __feed_analyse[i - 4].open && __feed_analyse[i].close < __feed_analyse[i - 4].close) {
                            if (__feed_analyse[i - 1].close <= __feed_analyse[i].open && __feed_analyse[i - 3].open >= __feed_analyse[i - 4].close) {
                                console.log('[01/32] detected suite (Bearish III Continues): market can go down from the sequance : ' + __feed_analyse[i].position);
                                // 01/32 - Bearish III Continues
                            }
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].low) {
                        console.log('[05/32] detected suite (Engulfing Bearish line): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 05/32 - Engulfing Bearish line
                        // need more analyses : the two candlesticks after [i] need to be down trend
                    }

                }

                if (__feed_analyse[i].symbol === 'D3') {
                    if ((__feed_analyse[i].high - __feed_analyse[i].open) > (__feed_analyse[i].open - __feed_analyse[i].close) * 20) {
                        console.log('[14/32] detected suite (Long Upper Shadow): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 14/32 - Long Upper Shadow
                    }

                    if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].high === __feed_analyse[i].high && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close) {
                            console.log('[15/32] detected suite (Tweezer Tops): market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 15/32 - Tweezer Tops
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D4') {
                    if ((__feed_analyse[i - 1].symbol.match(/D/) || __feed_analyse[i - 1].symbol.match(/U/)) && (__feed_analyse[i - 1].close === __feed_analyse[i].close || __feed_analyse[i - 1].open === __feed_analyse[i].close)) {
                        if ((__feed_analyse[i + 1].symbol.match(/D/) || __feed_analyse[i + 1].symbol.match(/U/)) && (__feed_analyse[i + 1].close === __feed_analyse[i].close || __feed_analyse[i + 1].open === __feed_analyse[i].close)) {
                            console.log('[13/32] detected suite (Shooting Star): market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 13/32 - Shooting Star
                        }
                    }

                    if (__feed_analyse[i - 1].symbol === 'D5' && __feed_analyse[i - 2].symbol === 'D4') {
                        if (__feed_analyse[i].open === __feed_analyse[i - 1].close && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                            console.log('[28/32] detected suite: (3 Bearish Soldier) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                            // 28/32 - 3 Bearish Soldier
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D5') {

                }
            }

            if (__feed_analyse[i].symbol.match(/S/)) {
                if (__feed_analyse[i].symbol === 'S1') {
                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].high < __feed_analyse[i - 1].open && __feed_analyse[i].low > __feed_analyse[i - 1].close) {
                        console.log('[03/32] detected suite (Bearish Harami Cross): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 03/32 - Bearish Harami Cross
                    }
                }

                if (__feed_analyse[i].symbol === 'S2') {

                }

                if (__feed_analyse[i].symbol === 'S3') {

                }

                if (__feed_analyse[i].symbol === 'S4') {

                }

                if (__feed_analyse[i].symbol === 'S5') {

                }
            }
        }
        return trend;
    }

    async icosAnalysesCoins(__Base, __timeframe = '1h', __ansi_color = false) {
        let __series = 0;
        this.icoAnalyses = [];
        let __Base_size = __Base.length;


        if (__Base === '__ALL_CURRENCIES__') {
            if (this.isVerbose) {
                console.log(' [!!] Analyses of all altcoin will be performed this action can take many time, cause be grace time between each request');
                console.log(' [!!] this operation can take up to ' + (((this.marketCurrenciesList * this.rateLimit) + this.marketCurrenciesList.length) / 60).toFixed(2) + ' minutes');
            }
        }

        for (let __i = 0; __i < __Base_size; __i++) {
            try {
                let __icoBase = __Base[__i];
                let __data_period = await this.ccxt_exchange.OHLCV_currency(__icoBase, __timeframe);
                let __data_period_symbolized = this.convert2symbol_format(__data_period);
                let symbolized = this.make_rsi(__data_period_symbolized, 14);
                let ico = this.last_seq(symbolized, 5);
                let ico_change = 0;
                let __rsi_analyses = this.rsi_analyses(ico, true);
                let __volume_analyses = this.volume_analyses(ico, true);
                let candelSignal = this.candle_predict(ico, 5);
                let __what_action_to_do = this.ansi.yellow('----');

                if (ico[4].gain > 0) {
                    ico_change = ico[4].gain;
                } else if (ico[4].loss > 0) {
                    ico_change = ico[4].loss * -1;
                }

                if (ico[4].RSI >= 16 && ico[4].RSI <= 30) {
                    // Buy signal
                    if (ico[3].symbol.match('/U/') && ico[2].symbol.match(/U/)) {
                        if (ico[2].close <= ico[3].close) {
                            __what_action_to_do = this.ansi.green('BUY');
                        }
                    }
                } else {
                    // Sell signal
                    if (ico[3].symbol.match(/D/) && ico[2].symbol.match(/D/)) {
                        if (ico[3].close >= ico[2].close) {
                            __what_action_to_do = this.ansi.yellow('SELL');
                        }
                    }
                }

                //console.dir(getSeqanceTrend(Isolate_Seq(last_24h_seq, 4, true)));
                //console.dir(getSeqanceTrend(last_24h_seq));
                let __trend_line = this.getSeqanceTrend(ico);
                let __global_trend_line = this.getSeqanceTrend(symbolized);
                let __icoData = {};

                if (__ansi_color) {
                    __icoData = {
                        ico: __icoBase,
                        time: ico[4].time,
                        high: ico[4].high,
                        open: (ico[4].open <= ico[4].close) ? this.ansi.green(ico[4].open) : this.ansi.yellow(ico[4].open),
                        close: (ico[4].close >= ico[4].open) ? this.ansi.green(ico[4].close) : this.ansi.yellow(ico[4].close),
                        low: ico[4].low,
                        candle: (ico[4].open <= ico[4].close) ? this.ansi.green('UP') : this.ansi.yellow('DOWN'),
                        //volume: ico[4].volume,
                        change: ico_change,
                        rsi: ico[4].RSI,
                        rsi_change: (__rsi_analyses.last_seq >= 0) ? this.ansi.green(__rsi_analyses.last_seq) : this.ansi.yellow(__rsi_analyses.last_seq),
                        rsi_changein: __rsi_analyses.last_period,
                        vol_change: (__volume_analyses.last_seq >= 0) ? this.ansi.green(__volume_analyses.last_seq) : this.ansi.yellow(__volume_analyses.last_seq),
                        vol_changein: __volume_analyses.last_period,
                        action: __what_action_to_do,
                        candelSignal: candelSignal,
                        trend_line: (__trend_line.status.toUpperCase() === 'UP') ? this.ansi.green(__trend_line.status.toUpperCase()) : this.ansi.cyan(__trend_line.status.toUpperCase()),
                        global_trend: (__global_trend_line.status.toUpperCase() === 'UP') ? this.ansi.green(__global_trend_line.status.toUpperCase()) : this.ansi.cyan(__global_trend_line.status.toUpperCase()),
                    }
                } else {
                    __icoData = {
                        ico: __icoBase,
                        time: ico[4].time,
                        high: ico[4].high,
                        open: ico[4].open,
                        close: ico[4].close,
                        low: ico[4].low,
                        candle: (ico[4].open <= ico[4].close) ? 'UP' : 'DOWN',
                        //volume: ico[4].volume,
                        change: ico_change,
                        rsi: ico[4].RSI,
                        rsi_change: __rsi_analyses.last_seq,
                        rsi_changein: __rsi_analyses.last_period,
                        vol_change: __volume_analyses.last_seq,
                        vol_changein: __volume_analyses.last_period,
                        action: __what_action_to_do,
                        candelSignal: candelSignal,
                        trend_line: __trend_line.status.toUpperCase(),
                        global_trend: __global_trend_line.status.toUpperCase(),
                    }

                }

                this.icoAnalyses.push(__icoData);
                if (this.isVerbose) {
                    console.log(' + ' + __icoBase + '  candleSignal: ' + candelSignal + ' - ' + ico[4].time + '  action: ' + __what_action_to_do);
                    console.log('  `--- [high:' + ico[4].high + ', open:' + ico[4].open + ', close:' + ico[4].close + ', low:' + ico[4].low + ']  candle: ' + ico[4].symbol + ' change:' + ico_change + '  rsi: ' + ico[4].RSI + ', rsi_change:(' + __rsi_analyses.last_seq + '% in ' + __rsi_analyses.last_period + '), vol:(' + __volume_analyses.last_seq + '%  in ' + __volume_analyses.last_period + '), trend during ' + __trend_line.sequance + ' sequances look go ' + __trend_line.status + ', grow:' + __trend_line.grow_percent.toFixed(2) + '%, decline:' + __trend_line.decline_percent.toFixed(2) + '%, variation:' + __trend_line.variation_percent.toFixed(2) + '%');
                }
            } catch (error) {
                console.log('Err: ' + error);
            }
            await this.time_t.__s_sleep(1.5);
        }

        if (this.display_on_table) {
            console.log(this.asTable(this.icoAnalyses));
        }
        return this.icoAnalyses;
    }

    async icoAnalysesCoin(__icoBase, __periods = ['1h', '4h', '12h', '24h'], __use_limited_sequances = true) {
        let __ico_analyse = [];
        //for (let i = 0; i < __periods.length; i++) {
        let __raw_data = await this.ccxt_exchange.OHLCV_currency(__icoBase, this.default_timeFrame);
        // BEGIN OF 1H FRAME
        let __symb = await this.convert2symbol_format(__raw_data);
        let __symbolized = await this.make_rsi(__symb, 14);
        if (__use_limited_sequances) {
            __symbolized = await this.last_seq(__symbolized, 24);
        }
        let __ico_report = await this.make_report('[ ** ] Report of 1h frame during 24h', __symbolized, true);
        __ico_analyse.push({
            ico_name: __icoBase,
            period: '1h',
            ico_data: __symbolized,
            report: __ico_report
        });
        // END OF 1H FRAME
        //}
        return __ico_analyse;

        // CONVERT TO 4H FRAME
        //let __period4h_symbolized = make_rsi(convert2symbol_format(change_period(__data_period_symbolized)), 14);
        //let last_1w_seq = last_seq(__period4h_symbolized, 42);
        //print_report('[ ** ] Report of 4h frame during 1 week', last_1w_seq);
        // END OF 4H FRAME
    }

    async make_report(label, __sequances, __display_report = false) {
      return new Promise((resolve, reject) => {
        console.log(' -- making report');
        let __resitance_list = [],
            __support_list = [];
        let __trend_line = this.getSeqanceTrend(__sequances);
        let __rsi_analyses = this.rsi_analyses(__sequances);
        //let __volume_analyses = await this.volume_analyses(__sequances);  // problem to review
        //let __resistances = await this.find_resistances(__sequances, true, 2); // problem to review
        //let __supports = await this.find_supports(__sequances, true, 2);
        let __report_period = this.ms_2period_human(__sequances[__sequances.length - 1].timestamp, __sequances[0].timestamp);
        //let __buy_sell_signal = await this.buy_sell_candle_detect(__sequances);
        //let __candle_predict = await this.candle_predict(__sequances);

        /*
        if (__display_report) {
            console.log(label);
            console.log(this.asTable(__sequances));
            console.log(' * Estimated period: ' + this.ms_2period_human(__sequances[__sequances.length - 1].timestamp, __sequances[0].timestamp));
            console.log(' * Ico Trend line during ' + __trend_line.sequance + ' sequances  status go ' + __trend_line.status);
            console.log(' * Grow : ' + __trend_line.grow_percent + '%  - Decline : ' + __trend_line.decline_percent + '%  - Variation: ' + __trend_line.variation_percent + '%');
            console.log(' * Volume change (%):  [ ' + __volume_analyses.full_period + ' -> ' + __volume_analyses.full_seq + '% ], [ ' + __volume_analyses.middle_period + ' -> ' + __volume_analyses.middle_seq + '% ], [ ' + __volume_analyses.last_period + ' -> ' + __volume_analyses.last_seq + '% ]');
            //console.log(' * RSI change (%):  [ ' + __rsi_analyses.full_period + ' -> ' + __rsi_analyses.full_seq + '% ], [ ' + __rsi_analyses.middle_period + ' -> ' + __rsi_analyses.middle_seq + '% ], [ ' + __rsi_analyses.last_period + ' -> ' + __rsi_analyses.last_seq + '% ]');
            console.log(' * CandleStick prediction:');
            //console.log(this.asTable(__candle_predict));

            console.log('* Buy/Sell Signal:');
            //console.log(this.asTable(__buy_sell_signal));

            __resistances.forEach(function(r) {
                __resitance_list.push(r.resistance + ' (' + r.occurence + ')');
            }, this);
            console.log(' * - Hard resistances :' + __resitance_list);
            console.log('');
            __supports.forEach(function(r) {
                __support_list.push(r.support + ' (' + r.occurence + ')');
            }, this);
            console.log(' * - Good supports: ' + __support_list);
        }
        */

        resolve({
            label: label,
            report_period: __report_period,
            trend_line: __trend_line,
            rsi_analyse: __rsi_analyses,
            //volume_analyse: __volume_analyses, // problem to review
            //resistances: __resistances, // problem to review
            //supports: __supports, // problem to review
            //candle_predict: __candle_predict,
            //buy_sell_signal: __buy_sell_signal,
        });
      });

    }

    async buy_sell_candle_detect(__feed_analyse, __seq = 1) {
        let __feed_size = __feed_analyse.length;
        let compare = '';
        let __bs_signal = [];
        let __analyse_period = 1;

        if (__seq === 1) {
            __analyse_period = 1;
        } else {
            __analyse_period = __feed_size - __seq;
        }
        let new_Signal = {};
        for (let i = __analyse_period; i < __feed_size; i++) {
            new_Signal = {};
            if (__feed_analyse[i].symbol.match(/U/) && __feed_analyse[i - 1].symbol.match(/U/)) {
                if (__feed_analyse[i].RSI >= 16 && __feed_analyse[i].RSI <= 20) {
                    //console.log(' [BUY Signal] - detected on the sequance ' + __feed_analyse[i].position + '  RSI = ' +  + ' - O: ' + __feed_analyse[i].open + '  C: ' + __feed_analyse[i].close + '  H: ' + __feed_analyse[i].high + '  L: ' + __feed_analyse[i].low);
                    __bs_signal.push({
                        timestamp: __feed_analyse[i].timestamp,
                        time: __feed_analyse[i].time,
                        signal: 'buy',
                        sequance: __feed_analyse[i].position,
                        rsi: __feed_analyse[i].RSI,
                        open: __feed_analyse[i].open,
                        close: __feed_analyse[i].close,
                        high: __feed_analyse[i].high,
                        low: __feed_analyse[i].low,
                    });
                }
            }

            if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/)) {
                if (__feed_analyse[i].RSI >= 70) {
                    //console.log(' [Sell Signal] - detected on the sequance ' + __feed_analyse[i].position + '  RSI = ' + __feed_analyse[i].RSI + ' - O: ' + __feed_analyse[i].open + '  C: ' + __feed_analyse[i].close + '  H: ' + __feed_analyse[i].high + '  L: ' + __feed_analyse[i].low);
                    __bs_signal.push({
                        timestamp: __feed_analyse[i].timestamp,
                        time: __feed_analyse[i].time,
                        signal: 'buy',
                        sequance: __feed_analyse[i].position,
                        rsi: __feed_analyse[i].RSI,
                        open: __feed_analyse[i].open,
                        close: __feed_analyse[i].close,
                        high: __feed_analyse[i].high,
                        low: __feed_analyse[i].low,
                    });
                }
            }
        }
        return __bs_signal;
    }

    async candle_predict(__feed_analyse, __seq = 10) {
        let __feed_size = __feed_analyse.length;
        let compare = '';
        let __prediction = [];

        // bullish => move up trend
        // bearish => move down trend

        let trend = 'N/A';

        for (let i = 4; i < __feed_size; i++) {
            /**
             * http://www.investopedia.com/articles/active-trading/092315/5-most-powerful-candlestick-patterns.asp
             * 1 - Three Line Strike  (Go UP) - 84%
             * 2 - Two Black Gapping (Go DOWN) - 68%
             * 3 - Three Black Crows (Go DOWN) - 78%
             * 4 - Evening Star (Go DOWN) - 72%
             * 5 - Abandoned Baby (Go UP) - 70%
             */

            // 1 - Three Line Strike  (Go UP) - 84% [D/D/D/U] (up trend)
            if (__feed_analyse[i].symbol.match(/U/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/D/)) {
                if (__feed_analyse[i].close > __feed_analyse[i - 3].open && __feed_analyse[i].open < __feed_analyse[i - 1]) {
                    // Up candel must be big than three candles before
                    if (__feed_analyse[i - 3].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1] && __feed_analyse[i - 3].close > __feed_analyse[i - 2].close && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close) {
                        // the three candles before the big UP candle must be in down trend
                        //console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Line Strike) market can go up (84%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        trend = 'Go Up 84%';
                        __prediction.push({
                            sequance: __feed_analyse[i].position,
                            time: __feed_analyse[i].time,
                            timestamp: __feed_analyse[i].timestamp,
                            rsi: __feed_analyse[i].RSI,
                            name: 'Three Line Strike',
                            percentage: '84',
                            msg: '[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Line Strike) market can go up (84%) from the sequance : ' + __feed_analyse[i].position + ', RSI: ' + __feed_analyse[i].RSI,
                            trend: 'UP',
                        });
                    }
                }
            }

            // 2 - Two Black Gapping (Go DOWN) - 68%  [U/D/D/D] (down trend)
            if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                if (__feed_analyse[i - 3].close >= __feed_analyse[i - 2].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].open && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                    //console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Two Black Gapping) market can go down (68%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    __prediction.push({
                        sequance: __feed_analyse[i].position,
                        time: __feed_analyse[i].time,
                        timestamp: __feed_analyse[i].timestamp,
                        rsi: __feed_analyse[i].RSI,
                        name: 'Two Black Gapping',
                        percentage: '68',
                        msg: '[ ' + __feed_analyse[i].time + ' ] detected suite: (Two Black Gapping) market can go down (68%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI,
                        trend: 'DOWN',
                    });
                }
                // 3 - Three Black Crows (Go DOWN) - 78%
                if (__feed_analyse[i - 3].close < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                    //console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Black Crows) market can go down (78%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    __prediction.push({
                        sequance: __feed_analyse[i].position,
                        time: __feed_analyse[i].time,
                        timestamp: __feed_analyse[i].timestamp,
                        rsi: __feed_analyse[i].RSI,
                        name: 'Three Black Crows',
                        percentage: '78',
                        msg: '[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Black Crows) market can go down (78%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI,
                        trend: 'DOWN',
                    });
                }
            }

            // 4 - Evening Star (Go DOWN) - 72%
            if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                if (__feed_analyse[i - 2].close < __feed_analyse[i - 1].close && __feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                    //console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Evening Star) market can go down (72%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    __prediction.push({
                        sequance: __feed_analyse[i].position,
                        time: __feed_analyse[i].time,
                        timestamp: __feed_analyse[i].timestamp,
                        rsi: __feed_analyse[i].RSI,
                        name: 'Evening Star',
                        percentage: '72',
                        msg: '[ ' + __feed_analyse[i].time + ' ] detected suite: (Evening Star) market can go down (72%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI,
                        trend: 'DOWN',
                    });
                }
            }

            // 5 - Abandoned Baby (Go UP) - 70%   [D/S(1,2,5)/U]
            if (__feed_analyse[i].symbol.match(/U/) && (__feed_analyse[i - 1].symbol === 'S1' || __feed_analyse[i - 1].symbol === 'S2' || __feed_analyse[i - 1].symbol === 'S5') && __feed_analyse[i - 2].symbol.match(/D/)) {
                if (__feed_analyse[i - 2].close >= __feed_analyse[i - 1].open && __feed_analyse[i].open >= __feed_analyse[i - 1].open) {
                    //console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Abandoned Baby) market can go up (70%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    __prediction.push({
                        sequance: __feed_analyse[i].position,
                        time: __feed_analyse[i].time,
                        timestamp: __feed_analyse[i].timestamp,
                        rsi: __feed_analyse[i].RSI,
                        name: 'Abandoned Baby',
                        percentage: '70',
                        msg: '[ ' + __feed_analyse[i].time + ' ] detected suite: (Abandoned Baby) market can go up (70%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI,
                        trend: 'UP',
                    });
                }
            }

            /**
             * END OF NEW DEFINITION
             */

            if ((__feed_analyse[i].close === __feed_analyse[i - 1].open || __feed_analyse[i].close === __feed_analyse[i - 1].close) && (__feed_analyse[i].open === __feed_analyse[i - 1].open || __feed_analyse[i].open === __feed_analyse[i - 1].close)) {
                // identical candle in size
                if ((__feed_analyse[i - 2].symbol === 'U5' || __feed_analyse[i - 2].symbol === 'S5') && (__feed_analyse[i - 2].close === __feed_analyse[i - 1].open || __feed_analyse[i - 2].close === __feed_analyse[i - 1].close)) {
                    //console.log('[16/32] detected suite: (Hanging Man [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 16/32 - Hanging Man [Bar confirm]
                    __prediction.push({
                        sequance: __feed_analyse[i].position,
                        time: __feed_analyse[i].time,
                        timestamp: __feed_analyse[i].timestamp,
                        rsi: __feed_analyse[i].RSI,
                        name: 'Hanging Man [Bar confirm',
                        percentage: 'n/a',
                        msg: '[ ' + __feed_analyse[i].time + ' ] [16/32] detected suite: (Hanging Man [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI,
                        trend: 'NEED CONFIRMATION',
                    });
                }

                if (__feed_analyse[i - 2].symbol === 'U4' && __feed_analyse[i - 3].symbol === 'D4' && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                    //console.log('[12/32] detected suite: (Inverted Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 12/32 - Inverted Hammer [Bar confirm]
                }

                if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                    // maybe need revision ... no i'm sure that need revision
                    if ((__feed_analyse[i - 2].open < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 2].close) || (__feed_analyse[i - 2].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open < __feed_analyse[i - 2].close)) {
                        //console.log('[27/32] detected suite: (On-Neck Line [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                        // 27/32 - On-Neck Line [Bar confirm]
                    }
                }

                /*  See revision of this situation -- need deleted when all is ok
                if (__feed_analyse[i - 2].symbol === 'D5') {
                    //console.log('[32/32] detected suite: (Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 32/32 - Hammer [Bar confirm]
                }
                */
            }

            if ((__feed_analyse[i].close > __feed_analyse[i - 1].open || __feed_analyse[i].close > __feed_analyse[i - 1].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
                // Up trend position 0 and position -1
                if (__feed_analyse[i - 2].symbol === 'S1' && __feed_analyse[i - 3].symbol.match(/U/)) {
                    if (__feed_analyse[i - 2].open < __feed_analyse[i - 3].close && __feed_analyse[i - 2].open > __feed_analyse[i - 3].open) {
                        //console.log('[19/32] detected suite: (Bullish Harami Cross) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 19/32  - Bullish Harami Cross
                    }
                }
            }


            if (__feed_analyse[i].symbol.match(/U/)) {
                if (__feed_analyse[i].symbol === 'U1') {
                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                        //console.log('[09/32] detected suite: (Separating Line Bearish) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 09/32 Separating Line Bearish
                    }

                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D1') {
                        if (__feed_analyse[i].open < __feed_analyse[i - 1].open && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open && __feed_analyse[i - 1].close < __feed_analyse[i - 2].close && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                            //console.log('[20/32] detected suite: (Pricing Line [Bar confirm]) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 20/32 Separating Line Bearish
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].open === __feed_analyse[i - 1].high) {
                        if ((__feed_analyse[i - 2].close > __feed_analyse[i - 3].open || __feed_analyse[i - 2].close > __feed_analyse[i - 3].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
                            //console.log('[21/32] detected suite: (Engulting Bullish Line) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 21/32 - Engulting Bullish Line
                        }


                    }

                    if (__feed_analyse[i - 1].symbol === 'S1' && __feed_analyse[i - 2].symbol === 'D1') {
                        if (__feed_analyse[i - 1].open < __feed_analyse[i - 1].close && __feed_analyse[i - 1].open < __feed_analyse[i].open && __feed_analyse[i - 2].open > __feed_analyse[i].close) {
                            //console.log('[22/32] detected suite: (Morning Doji Star) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                            // 22/32 - Morning doji star
                        }
                    }
                }

                if (__feed_analyse[i].symbol === 'U2') {
                    if ((__feed_analyse[i].open - __feed_analyse[i].low) > (__feed_analyse[i].close - __feed_analyse[i].open) * 20) {
                        //console.log('[30/32] detected suite: (Long Lower Shadow) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 30/32 - Long Lower Shadow
                    }

                }

                if (__feed_analyse[i].symbol === 'U3') {

                }

                if (__feed_analyse[i].symbol === 'U4') {

                }

                if (__feed_analyse[i].symbol === 'U5') {
                    if (__feed_analyse[i - 1].symbol === 'U4' && __feed_analyse[i - 2].symbol === 'U5') {
                        if (__feed_analyse[i - 1].close === __feed_analyse[i].open && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                            //console.log('[11/32] detected suite: (Bullish Soldier) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 11/32  3 Bullish Soldier
                        }
                    }
                }

                if (__feed_analyse[i].symbol === 'U6') {

                }

            }


            if (__feed_analyse[i].symbol.match(/D/)) {

                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].high < __feed_analyse[i - 1].close && __feed_analyse[i - 1].low > __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 2].high < __feed_analyse[i - 1].close && __feed_analyse[i - 2].close < __feed_analyse[i - 1].low) {
                        //console.log('[02/32] detected suite: (Bearish harami) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 02/32 Bearish harami  * Look like ok
                    }
                }

                /**
                 * Bearish Hammer - Shooting Star
                 */
                if (__feed_analyse[i - 1].symbol === 'D3' || __feed_analyse[i].symbol === 'D3') {
                    if (__feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                        //console.log('[**] detected suite: (Bearish Hammer - Shooting Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // Bearish Hammer - Shooting Star
                    }
                }


                if (__feed_analyse[i].symbol === 'D1') {
                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i].open > __feed_analyse[i - 1].open && __feed_analyse[i].open < __feed_analyse[i - 1].close) {
                            if (__feed_analyse[i - 1].close > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open) {
                                //console.log('[04/32] detected suite: (Dark Cloud Cover [Bar confirm]) market can go down from the sequance : ' + __feed_analyse[i].position);
                                // 04/32 - Dark Cloud Cover [Bar confirm]
                            }
                        }

                        if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'U1') {
                            if (__feed_analyse[i].close === __feed_analyse[i - 1].open && __feed_analyse[i - 2].open === __feed_analyse[i - 1].open) {
                                //console.log('[23/32] detected suite: (Morning Star) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                                // 23/32 - Morning Star
                            }
                        }

                        if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                            //console.log('[25/32] detected suite: (Separating Line Bullish) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                            // 25/32 - Separating Line Bullish
                        }


                    }

                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D2' && __feed_analyse[i - 3].symbol === 'D1') {
                        if (__feed_analyse[i].low === __feed_analyse[i - 1].low && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                            //console.log('[31/32] detected suite: (Tweezer Bottoms) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                            // 31/32 - Tweezer Bottoms
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i].open < __feed_analyse[i - 1].close && __feed_analyse[i].close > __feed_analyse[i - 1].open) {
                            //console.log('[02/32] detected suite: (Bullish Harami) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                            // 02/32 - Bullish Harami
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/S/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].open > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                            //console.log('[06/32] detected suite: (Evening Doji Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 06/32 - Evening Doji Star
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].open === __feed_analyse[i].open && __feed_analyse[i - 2].close === __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                            //console.log('[07/32] detected suite: (Evening Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 07/32 - Evening Star
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D2') {
                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/) && __feed_analyse[i - 3].symbol.match(/U/) && __feed_analyse[i - 4].symbol.match(/D/)) {
                        if (__feed_analyse[i].open > __feed_analyse[i - 4].open && __feed_analyse[i].close < __feed_analyse[i - 4].close) {
                            if (__feed_analyse[i - 1].close <= __feed_analyse[i].open && __feed_analyse[i - 3].open >= __feed_analyse[i - 4].close) {
                                //console.log('[01/32] detected suite (Bearish III Continues): market can go down from the sequance : ' + __feed_analyse[i].position);
                                // 01/32 - Bearish III Continues
                            }
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].low) {
                        //console.log('[05/32] detected suite (Engulfing Bearish line): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 05/32 - Engulfing Bearish line
                        // need more analyses : the two candlesticks after [i] need to be down trend
                    }

                }

                if (__feed_analyse[i].symbol === 'D3') {
                    if ((__feed_analyse[i].high - __feed_analyse[i].open) > (__feed_analyse[i].open - __feed_analyse[i].close) * 20) {
                        //console.log('[14/32] detected suite (Long Upper Shadow): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 14/32 - Long Upper Shadow
                    }

                    if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                        if (__feed_analyse[i - 1].high === __feed_analyse[i].high && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close) {
                            //console.log('[15/32] detected suite (Tweezer Tops): market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 15/32 - Tweezer Tops
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D4') {
                    if ((__feed_analyse[i - 1].symbol.match(/D/) || __feed_analyse[i - 1].symbol.match(/U/)) && (__feed_analyse[i - 1].close === __feed_analyse[i].close || __feed_analyse[i - 1].open === __feed_analyse[i].close)) {
                        if ((__feed_analyse[i + 1].symbol.match(/D/) || __feed_analyse[i + 1].symbol.match(/U/)) && (__feed_analyse[i + 1].close === __feed_analyse[i].close || __feed_analyse[i + 1].open === __feed_analyse[i].close)) {
                            //console.log('[13/32] detected suite (Shooting Star): market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 13/32 - Shooting Star
                        }
                    }

                    if (__feed_analyse[i - 1].symbol === 'D5' && __feed_analyse[i - 2].symbol === 'D4') {
                        if (__feed_analyse[i].open === __feed_analyse[i - 1].close && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                            //console.log('[28/32] detected suite: (3 Bearish Soldier) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                            // 28/32 - 3 Bearish Soldier
                        }
                    }

                }

                if (__feed_analyse[i].symbol === 'D5') {

                }
            }

            if (__feed_analyse[i].symbol.match(/S/)) {
                if (__feed_analyse[i].symbol === 'S1') {
                    if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].high < __feed_analyse[i - 1].open && __feed_analyse[i].low > __feed_analyse[i - 1].close) {
                        //console.log('[03/32] detected suite (Bearish Harami Cross): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 03/32 - Bearish Harami Cross
                    }
                }

                if (__feed_analyse[i].symbol === 'S2') {

                }

                if (__feed_analyse[i].symbol === 'S3') {

                }

                if (__feed_analyse[i].symbol === 'S4') {

                }

                if (__feed_analyse[i].symbol === 'S5') {

                }
            }
        }
        return __prediction;
    }

    async find_resistances(__feed_core, __includeHigh = false, __min_touch = 2) {
        let __feed_size = __feed_core.length;
        let resistances = [];
        let __res = [];
        for (let i = 0; i < __feed_size; i++) {
            if (__feed_core[i].symbol.match(/U/)) {
                if (__includeHigh) {
                    __res.push(__feed_core[i].high, __feed_core[i].close);
                } else {
                    __res.push(__feed_core[i].close);
                }
            }
        }
        for (let i = 0; i < __res.length; i++) {
            let count = 1;
            let tester = __res[i];
            if (tester) {
                for (let y = (i + 1); y < __res.length; y++) {
                    if (tester === __res[y]) {
                        count += 1;
                        __res[y] = undefined;
                    }
                }
                resistances.push({ resistance: tester, occurence: count });
            }
        }
        let __n_res = [];

        for (let i = 0; i < resistances.length; i++) {
            if (resistances[i].occurence >= __min_touch) {
                __n_res.push(resistances[i]);
            }
        }
        return __n_res;
    }

    async find_supports(__feed_core, __includeHigh = false, __min_touch = 2) {
        let __feed_size = __feed_core.length;
        let supports = [];
        let __supp = [];
        for (let i = 0; i < __feed_size; i++) {
            if (__feed_core[i].symbol.match(/D/)) {
                if (__includeHigh) {
                    __supp.push(__feed_core[i].low, __feed_core[i].close);
                } else {
                    __supp.push(__feed_core[i].close);
                }
            }
        }

        for (let i = 0; i < __supp.length; i++) {
            let count = 1;
            let tester = __supp[i];
            if (tester) {
                for (let y = (i + 1); y < __supp.length; y++) {
                    if (tester === __supp[y]) {
                        count += 1;
                        __supp[y] = undefined;
                    }
                }
                supports.push({ support: tester, occurence: count });
            }
        }

        let __n_supp = [];

        for (let i = 0; i < supports.length; i++) {
            if (supports[i].occurence >= __min_touch) {
                __n_supp.push(supports[i]);
            }
        }
        return __n_supp;
    }

}
