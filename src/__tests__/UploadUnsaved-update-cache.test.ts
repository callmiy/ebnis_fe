/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCache } from "../components/UploadUnsaved/update-cache";
import { ExperiencesIdsToObjectMap } from "../components/UploadUnsaved/utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_fieldDefs,
} from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/write-get-experience-full-query-to-cache");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

import { deleteIdsFromCache } from "../state/resolvers/delete-references-from-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import { writeGetExperienceFullQueryToCache } from "../state/resolvers/write-get-experience-full-query-to-cache";
import { writeSavedAndUnsavedExperiencesToCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import {
  MUTATION_NAME_createUnsavedEntry,
  MUTATION_NAME_createUnsavedExperience,
  QUERY_NAME_getExperience,
} from "../state/resolvers";
import { SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME } from "../state/unsaved-resolvers";

const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;

const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

const mockWriteGetExperienceFullQueryToCache = writeGetExperienceFullQueryToCache as jest.Mock;

const mockWriteSavedAndUnsavedExperiencesToCache = writeSavedAndUnsavedExperiencesToCache as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

test("completely saved unsaved experience", () => {
  const unsavedExperiencesMap = {
    "1": {
      experience: {
        id: "1",
        clientId: "1",
        fieldDefs: [
          {
            id: "1",
          },
        ] as ExperienceFragment_fieldDefs[],
        entries: {
          edges: [
            {
              node: {},
            },
          ] as ExperienceFragment_entries_edges[],
        } as ExperienceFragment_entries,
      } as ExperienceFragment,

      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [],
      newlySavedExperience: {
        id: "1s",
        clientId: "1",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
  };

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap,
    savedExperiencesMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(0);
  expect(mockWriteGetExperienceFullQueryToCache).toHaveBeenCalledTimes(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    [
      "Experience:1",
      "FieldDef:1",
      `${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:1`,
    ],
    {
      mutations: [[MUTATION_NAME_createUnsavedExperience, "Experience:1"]],

      queries: [[QUERY_NAME_getExperience, "Experience:1"]],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "1": {
      id: "1s",
      clientId: "1",
      entries: {
        edges: [],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual(
    [],
  );
});

test("partially saved unsaved experience", () => {
  const unsavedExperiencesMap = {
    "2": {
      // experience partially saved, will be deleted from cache
      experience: {
        id: "2",
        clientId: "2",
        fieldDefs: [
          {
            id: "1",
          },
        ] as ExperienceFragment_fieldDefs[],
        entries: {
          edges: [
            {
              node: {},
            },
          ] as ExperienceFragment_entries_edges[],
        } as ExperienceFragment_entries,
      } as ExperienceFragment,
      // one of these entries (21) failed to save -hence this experience is
      // partially saved
      unsavedEntries: [
        { id: "21" }, // did not save
        { id: "221" }, // saved, will be deleted from cache
      ] as ExperienceFragment_entries_edges_node[],
      entriesErrors: { "21": "1" },
      savedEntries: [], // an unsaved experience never has savedEntries
      newlySavedEntries: [
        { id: "22" } as ExperienceFragment_entries_edges_node,
      ],
      newlySavedExperience: {
        id: "2s",
        clientId: "2",
        entries: {
          edges: [
            {
              node: {
                clientId: "221",
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
  };

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap,
    savedExperiencesMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockWriteGetExperienceFullQueryToCache).toHaveBeenCalledTimes(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    ["Experience:2", "FieldDef:1", "Entry:221"],
    {
      mutations: [
        [MUTATION_NAME_createUnsavedExperience, "Experience:2"],
        [MUTATION_NAME_createUnsavedEntry, "Entry:221"],
      ],

      queries: [[QUERY_NAME_getExperience, "Experience:2"]],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "2": {
      hasUnsaved: true,
      id: "2s",
      clientId: "2",
      entries: {
        edges: [
          {
            node: {
              clientId: "221",
            },
          },

          {
            __typename: "EntryEdge",
            cursor: "",
            node: {
              id: "21",
            },
          },
        ],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "2s",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("unsaved experience not saved", () => {
  const unsavedExperiencesMap = {
    "3": {
      // newlySavedExperience = undefined, outstanding unsaved count = 2
      experience: {
        id: "3",
      } as ExperienceFragment,
      // since experience did not save, ditto entry. outstanding unsaved
      // count = 3
      unsavedEntries: [{} as ExperienceFragment_entries_edges_node],
      entriesErrors: {},
      savedEntries: [],
      newlySavedEntries: [],
    },
  };

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap,
    savedExperiencesMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(2);
  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "3",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("saved experience with unsaved entry not saved", () => {
  const savedExperiencesMap = {
    "6": {
      // has an unsaved entry, so we will put it back in savedUnsaved
      experience: {
        id: "6",
        entries: {
          edges: [
            {
              // a previously unsaved entry now saved

              node: {
                id: "22",
                clientId: "22-c", // will be deleted from cache
              },
            },

            // this has always been a saved entry - must not be touched.
            {
              node: {
                id: "23",
                clientId: "23-c",
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [
        {
          id: "22s",
          clientId: "22-c",
        } as ExperienceFragment_entries_edges_node,
      ],
      // so we have one entry we are unable to save,
      // outstanding unsaved count = 6
      entriesErrors: { yy: "x" },
    },
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache.mock.calls[0][1]).toEqual({
    id: "6",
    entries: {
      edges: [
        { node: { clientId: "22-c", id: "22s" } },
        { node: { clientId: "23-c", id: "23" } },
      ],
    },
  });

  expect(outstandingUnsavedCount).toBe(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith({}, ["Entry:22-c"], {
    mutations: [[MUTATION_NAME_createUnsavedEntry, "Entry:22-c"]],

    queries: [],
  });

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "6": {
      id: "6",
      entries: {
        edges: [
          { node: { clientId: "22-c", id: "22s" } },
          { node: { clientId: "23-c", id: "23" } },
        ],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "6",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("saved experience with no 'newlySavedEntries' ", () => {
  const savedExperiencesMap = {
    "4": {
      experience: {
        id: "4",
      },
      // newlySavedEntries = undefined
      unsavedEntries: [{}],
    } as any,
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "4",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("saved experience with empty 'newlySavedEntries' ", () => {
  const savedExperiencesMap = {
    "5": {
      experience: {
        id: "5",
      },
      unsavedEntries: [{}],
      newlySavedEntries: [],
    } as any,
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "5",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("saved experience completely saved", () => {
  const savedExperiencesMap = {
    "7": {
      experience: {
        id: "7",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [
        { clientId: "71-c" },
      ] as ExperienceFragment_entries_edges_node[],
    },
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache.mock.calls[0][1]).toEqual({
    id: "7",
    entries: { edges: [] },
    hasUnsaved: null,
  });

  expect(outstandingUnsavedCount).toBe(0);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    ["Entry:71-c", `${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:7`],
    {
      mutations: [[MUTATION_NAME_createUnsavedEntry, "Entry:71-c"]],

      queries: [],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "7": {
      id: "7",
      entries: { edges: [] },
      hasUnsaved: null,
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual(
    [],
  );
});

it("is a noop when updating and there is nothing to update", () => {
  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(0);

  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache).not.toHaveBeenCalled();
});
