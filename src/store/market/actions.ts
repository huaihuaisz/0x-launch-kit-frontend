import { BigNumber } from '0x.js';
import { push } from 'connected-react-router';
import queryString from 'query-string';
import { createAction } from 'typesafe-actions';

import { availableMarkets } from '../../common/markets';
import { getRelayer } from '../../services/relayer';
import { getWeb3WrapperOrThrow } from '../../services/web3_wrapper';
import { getKnownTokens } from '../../util/known_tokens';
import { CurrencyPair, Market, StoreState, Token } from '../../util/types';

export const setMarketTokens = createAction('SET_MARKET_TOKENS', resolve => {
    return ({ baseToken, quoteToken }: { baseToken: Token; quoteToken: Token }) => resolve({ baseToken, quoteToken });
});

export const setCurrencyPair = createAction('SET_CURRENCY_PAIR', resolve => {
    return (currencyPair: CurrencyPair) => resolve(currencyPair);
});

export const setMarkets = createAction('SET_MARKETS', resolve => {
    return (markets: Market[]) => resolve(markets);
});

export const changeMarket = (currencyPair: CurrencyPair) => {
    return async (dispatch: any, getState: any) => {
        const state = getState() as StoreState;
        const newSearch = queryString.stringify({
            ...queryString.parse(state.router.location.search),
            base: currencyPair.base,
            quote: currencyPair.quote,
        });

        dispatch(
            push({
                ...state.router.location,
                pathname: '/',
                search: newSearch,
            }),
        );

        location.reload();
    };
};

export const getMarkets = () => {
    return async (dispatch: any, getState: any) => {
        const web3Wrapper = await getWeb3WrapperOrThrow();
        const networkId = await web3Wrapper.getNetworkIdAsync();
        const knownTokens = getKnownTokens(networkId);
        const relayer = getRelayer();

        const markets = await Promise.all(
            availableMarkets.map(async market => {
                const baseToken = knownTokens.getTokenBySymbol(market.base);
                const quoteToken = knownTokens.getTokenBySymbol(market.quote);

                const price = await relayer.getCurrencyPairPriceAsync(baseToken, quoteToken);

                return {
                    currencyPair: market,
                    price,
                };
            }),
        );

        dispatch(setMarkets(markets));
    };
};
