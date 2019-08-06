import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import {
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../constants/apollo-schema";
import { getSocket } from "../socket";
import { initState } from "./resolvers";
import { PersistentStorage, PersistedData } from "apollo-cache-persist/types";
import {
  MakeSocketLinkFn,
  middlewareErrorLink,
  middlewareLoggerLink,
  middlewareAuthLink,
} from "./apollo-middlewares";
import { CUSTOM_QUERY_RESOLVERS } from "./custom-query-resolvers";

export function buildClientCache(
  {
    uri,
    resolvers,
    invalidateCache,
  }: BuildClientCache = {} as BuildClientCache,
) {
  // we may invoke this function, `buildClientCache`,
  // for the first time either from cypress or from
  // our app (we really don't know which will come first and we really don't
  // care). The idea is that if `buildClientCache` is invoked first from
  // cypress, we make sure that subsequent invocation uses the cypress version.
  // This should fix the problem whereby the cache used by some part of cypress
  // is out of sync with other parts because some are using cypress version
  // while others are using app version

  let { cache, persistor } = clientCacheFromCypress(invalidateCache);

  if (!cache) {
    cache = new InMemoryCache({
      addTypename: true,

      cacheRedirects: {
        ...CUSTOM_QUERY_RESOLVERS,
      },
    }) as InMemoryCache;
  }

  persistor = makePersistor(cache, persistor);

  const makeSocketLink: MakeSocketLinkFn = makeSocketLinkArgs => {
    const absintheSocket = AbsintheSocket.create(
      getSocket({
        uri,
        ...makeSocketLinkArgs,
      }),
    );

    return createAbsintheSocketLink(absintheSocket);
  };

  let link = middlewareAuthLink(makeSocketLink);
  link = middlewareErrorLink(link);
  link = middlewareLoggerLink(link);

  const client = new ApolloClient({
    cache,
    link,
  }) as ApolloClient<{}>;

  const state = initState();

  cache.writeData({
    data: state.defaults,
  });

  client.addResolvers(state.resolvers);

  if (resolvers) {
    client.addResolvers(resolvers);
  }

  setupCypressApollo({ client, cache, persistor });

  return { client, cache, persistor };
}

export type RestoreCacheOrPurgeStorageFn = (
  persistor: CachePersistor<{}>,
) => Promise<CachePersistor<{}>>;

function makePersistor(
  appCache: InMemoryCache,
  persistor?: CachePersistor<{}>,
) {
  persistor = persistor
    ? persistor
    : (new CachePersistor({
        cache: appCache,
        storage: localStorage as PersistentStorage<PersistedData<{}>>,
        key: SCHEMA_KEY,
        maxSize: false,
      }) as CachePersistor<{}>);

  return persistor;
}

export async function restoreCacheOrPurgeStorage(
  persistor: CachePersistor<{}>,
) {
  const currentVersion = localStorage.getItem(SCHEMA_VERSION_KEY);

  if (currentVersion === SCHEMA_VERSION) {
    // If the current version matches the latest version,
    // we're good to go and can restore the cache.
    await persistor.restore();
  } else {
    // Otherwise, we'll want to purge the outdated persisted cache
    // and mark ourselves as having updated to the latest version.
    await persistor.purge();
    localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  }

  return persistor;
}

export const resetClientAndPersistor = async (
  appClient: ApolloClient<{}>,
  appPersistor: CachePersistor<{}>,
) => {
  await appPersistor.pause(); // Pause automatic persistence.
  await appPersistor.purge(); // Delete everything in the storage provider.
  await appClient.clearStore();
  await appPersistor.resume();
};

interface BuildClientCache {
  uri?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers: any;

  invalidateCache?: boolean;
}

///////////////////// END TO END TESTS THINGS ///////////////////////

export const CYPRESS_APOLLO_KEY = "ebnis-cypress-apollo";

function clientCacheFromCypress(invalidateCache?: boolean) {
  const result: {
    cache?: InMemoryCache;
    persistor?: CachePersistor<{}>;
    client?: ApolloClient<{}>;
  } = {};

  if (invalidateCache) {
    // We need to set up local storage for local state management
    // so that whatever we persist in e2e tests will be picked up by apollo
    // when app starts. Otherwise, apollo will always clear out the local
    // storage when the app starts if it can not read the schema version.
    localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

    return result;
  }

  if (typeof window === "undefined" || !window.Cypress) {
    return result;
  }

  const cypressApollo = window.Cypress.env(
    CYPRESS_APOLLO_KEY,
  ) as E2EWindowObject;

  if (!cypressApollo) {
    return result;
  }

  // some how if I use the client from cypress, /app/ route fails to render
  // client = cypressApollo.client;

  return {
    cache: cypressApollo.cache,
    persistor: cypressApollo.persistor,
  };
}

export function setupCypressApollo(args: {
  client: ApolloClient<{}>;
  cache: InMemoryCache;
  persistor: CachePersistor<{}>;
}) {
  if (window.Cypress) {
    window.Cypress.env(CYPRESS_APOLLO_KEY, {
      cache: args.cache,
      client: args.client,
      persistor: args.persistor,
    });
  }
}

export interface E2EWindowObject {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  persistor: CachePersistor<{}>;
}

declare global {
  interface Window {
    Cypress: {
      env: <T>(k?: string, v?: T) => void | T;
    };

    ____ebnis: E2EWindowObject;
  }
}
