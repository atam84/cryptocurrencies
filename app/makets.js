/**
    Market Structure
    {
        'id':     'btcusd',  // string literal for referencing within an exchange
        'symbol': 'BTC/USD', // uppercase string literal of a pair of currencies
        'base':   'BTC',     // uppercase string, base currency, 3 or more letters
        'quote':  'USD',     // uppercase string, quote currency, 3 or more letters
        'info':   { ... },   // the original unparsed market info from the exchange
    }

    Example:
        'BTS/ETH': {
            limits: {
                amount: [Object], price: [Object]
            },
            precision: {
                amount: 8, price: 8
            },
            maker: 0.0025,
            taker: 0.0025,
            id: 'ETH-BTS',
            symbol: 'BTS/ETH',
            base: 'BTS',
            quote: 'ETH',
            info: { 
                MarketCurrency: 'BTS',
                BaseCurrency: 'ETH',
                MarketCurrencyLong: 'Bitshares',
                BaseCurrencyLong: 'Ethereum',
                MinTradeSize: 1e-8,
                MarketName: 'ETH-BTS',
                IsActive: true,
                Created: '2017-08-04T18:01:27.853',
                Notice: 'This market will be deleted on October 13th, 2017.',
                IsSponsored: null,
                LogoUrl: 'https://bittrexblobstorage.blob.core.windows.net/public/b167ab3b-9e08-4fc4-ac1d-088bf16200c4.png' 
            }
        },
**/