import gql from "graphql-tag";
import { FIELD_DEF_FRAGMENT } from "./field-def.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

// the minimum fields needed to quickly display an experience
export const EXPERIENCE_MINI_FRAGMENT = gql`
  fragment ExperienceMiniFragment on Experience {
    id
    title
    description
    clientId
    insertedAt
    updatedAt
    hasUnsaved
  }
`;

// the fields not in mini fragment.
export const EXPERIENCE_REST_FRAGMENT = gql`
  fragment ExperienceRestFragment on Experience {
    id

    fieldDefs {
      ...FieldDefFragment
    }

    entries(pagination: $entriesPagination) {
      ...EntryConnectionFragment
    }
  }

  ${FIELD_DEF_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export const EXPERIENCE_FRAGMENT = gql`
  fragment ExperienceFragment on Experience {
    ...ExperienceMiniFragment

    fieldDefs {
      ...FieldDefFragment
    }

    entries(pagination: $entriesPagination) {
      ...EntryConnectionFragment
    }
  }

  ${EXPERIENCE_MINI_FRAGMENT}
  ${FIELD_DEF_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export const EXPERIENCE_CONNECTION_FRAGMENT = gql`
  fragment ExperienceConnectionFragment on ExperienceConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }

    edges {
      cursor
      node {
        ...ExperienceFragment
      }
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export const EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT = gql`
  fragment ExperienceConnectionPreFetchFragment on ExperienceConnection {
    edges {
      cursor
      node {
        ...ExperienceRestFragment
      }
    }
  }

  ${EXPERIENCE_REST_FRAGMENT}
`;

export const EXPERIENCE_NO_ENTRY_FRAGMENT = gql`
  fragment ExperienceNoEntryFragment on Experience {
    ...ExperienceMiniFragment

    fieldDefs {
      ...FieldDefFragment
    }
  }

  ${EXPERIENCE_MINI_FRAGMENT}
  ${FIELD_DEF_FRAGMENT}
`;
