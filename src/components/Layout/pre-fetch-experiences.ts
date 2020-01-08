import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables,
} from "../../graphql/apollo-types/PreFetchExperiences";
import {
  PRE_FETCH_EXPERIENCES_QUERY,
} from "../../graphql/get-experience-connection-mini.query";
import { InMemoryCache } from "apollo-cache-inmemory";
import { removeQueriesAndMutationsFromCache } from "../../state/resolvers/delete-references-from-cache";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";

export function preFetchExperiences({
  ids,
  client,
  onDone,
  cache,
}: PreFetchExperiencesFnArgs) {
  client
    .query<PreFetchExperiences, PreFetchExperiencesVariables>({
      query: PRE_FETCH_EXPERIENCES_QUERY,
      variables: {
        input: {
          ids,
        },
        ...entriesPaginationVariables,
      },
    })
    .then(() => {
      onDone();

      setTimeout(() => {
        // we really do not want to keep the cached values of this operation
        // around as we only fire the query once during app boot.
        removeQueriesAndMutationsFromCache(cache, [
          `getExperiences({"input":{"ids":`,
        ]);
      }, 100);
    });
}

export interface PreFetchExperiencesFnArgs {
  ids: string[];
  client: ApolloClient<{}>;
  onDone: () => void;
  cache: InMemoryCache;
}
