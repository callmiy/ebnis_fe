import { DataProxy } from "apollo-cache";
import {
  SavedAndUnsavedExperiencesQueryReturned,
  SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  SavedAndUnsavedExperiences,
  SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
} from "../offline-resolvers";
import { isOfflineId } from "../../constants";
import { getExperiencesFromCache } from "./get-experiences-from-cache";
import ApolloClient from "apollo-client";
import immer from "immer";

export function writeSavedAndUnsavedExperiencesToCache(
  dataProxy: DataProxy,
  data: SavedAndUnsavedExperiences[],
) {
  dataProxy.writeQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,

    data: {
      savedAndUnsavedExperiences: data,
    },
  });
}

export async function updateEntriesCountInCache(
  client: ApolloClient<{}>,
  id: string,
) {
  let cacheData = await getExperiencesFromCache(client);

  if (cacheData.length === 0) {
    cacheData = [
      {
        id: id,
        unsavedEntriesCount: isOfflineId(id) ? 0 : 1,
        __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
      },
    ];
  } else {
    cacheData = immer(cacheData, proxy => {
      let index = 0;
      let len = proxy.length;

      for (; index < len; index++) {
        const map = proxy[index];

        if (map.id === id) {
          ++map.unsavedEntriesCount;
        }

        proxy[index] = map;
      }
    });
  }

  writeSavedAndUnsavedExperiencesToCache(client, cacheData);
}

export async function deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache(
  client: ApolloClient<{}>,
  ids: string[],
) {
  const cacheData = (await getExperiencesFromCache(
    client,
  )).reduce(
    (acc, map) => {
      if (ids.includes(map.id)) {
        return acc;
      }

      acc.push(map);

      return acc;
    },
    [] as SavedAndUnsavedExperiences[],
  );

  writeSavedAndUnsavedExperiencesToCache(client, cacheData);
}