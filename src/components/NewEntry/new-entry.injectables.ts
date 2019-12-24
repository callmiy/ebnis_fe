/* eslint-disable react-hooks/rules-of-hooks */

import { ApolloClient } from "apollo-client";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_ENTRY_MUTATION } from "../../graphql/create-entry.mutation";
import {
  CreateEntryMutation,
  CreateEntryMutationVariables,
} from "../../graphql/apollo-types/CreateEntryMutation";
import {
  CREATE_ENTRY_OFFLINE_MUTATION,
  CreateEntryOfflineMutationReturned,
  CreateEntryOfflineVariables,
  newEntryResolvers,
} from "./new-entry.resolvers";
import immer from "immer";
import {
  ExperienceFragment,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges_node,
} from "../../graphql/apollo-types/ExperienceFragment";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { DataProxy } from "apollo-cache";
import { FetchResult } from "apollo-link";
import { readGetExperienceFullQueryFromCache } from "../../state/resolvers/read-get-experience-full-query-from-cache";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";

export function addResolvers(client: ApolloClient<{}>) {
  if (window.____ebnis.newEntryResolversAdded) {
    return;
  }

  client.addResolvers(newEntryResolvers);
  window.____ebnis.newEntryResolversAdded = true;
}

export function useCreateOnlineEntry() {
  return useMutation<CreateEntryMutation, CreateEntryMutationVariables>(
    CREATE_ENTRY_MUTATION,
  );
}

export function useCreateEntryOffline() {
  return useMutation<
    CreateEntryOfflineMutationReturned,
    CreateEntryOfflineVariables
  >(CREATE_ENTRY_OFFLINE_MUTATION);
}

type Fn<T = string | ExperienceFragment> = (
  arg: T,
) => (
  proxy: DataProxy,
  mutationResult: FetchResult<CreateEntryMutation>,
) => T extends ExperienceFragment
  ? Promise<ExperienceFragment>
  : Promise<ExperienceFragment | undefined>;

/**
 * Insert the entry into the experience and updates the Get full experience
 * query
 */
export const updateExperienceWithNewEntry: Fn = function updateFn(
  experienceOrId,
) {
  return async function updateFnInner(
    dataProxy,
    { data: createEntryResponse },
  ) {
    const entry =
      createEntryResponse &&
      createEntryResponse.createEntry &&
      createEntryResponse.createEntry.entry;

    let experience = experienceOrId as (ExperienceFragment | null);

    if (typeof experienceOrId === "string") {
      if (!entry) {
        return;
      }

      experience = readGetExperienceFullQueryFromCache(
        dataProxy,
        experienceOrId,
      );

      if (!experience) {
        return;
      }
    }

    const updatedExperience = immer(experience as ExperienceFragment, proxy => {
      const entries = proxy.entries as ExperienceFragment_entries;
      const edges = entries.edges || [];

      edges.unshift(
        entryToEdge(entry as ExperienceFragment_entries_edges_node),
      );

      entries.edges = edges;
      proxy.entries = entries;
    });

    // PLEASE I NEED TO CHECK THIS AGAIN AS WE ARE ALREADY WRITING THE FULL
    // EXPERIENCE FRAGMENT IN my-experiences/pre-fetch-experiences.
    // if we don't re-write the experience fragment we will only be able to
    // query EXPERIENCE_MINI_FRAGMENT and not EXPERIENCE_FRAGMENT.
    writeGetExperienceFullQueryToCache(dataProxy, updatedExperience, {
      writeFragment: true,
    });

    return updatedExperience;
  };
};