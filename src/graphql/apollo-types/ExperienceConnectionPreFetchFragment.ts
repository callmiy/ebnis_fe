/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FieldType } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceConnectionPreFetchFragment
// ====================================================

export interface ExperienceConnectionPreFetchFragment_edges_node_fieldDefs {
  __typename: "FieldDef";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type of the field
   */
  type: FieldType;
  /**
   * String that uniquely identifies this field definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `createField.defId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating backwards, are there more items?
   */
  hasPreviousPage: boolean;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node {
  __typename: "Entry";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  expId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved with the server, the client ID uniquely
   *   identifies this entry and will be used prevent conflict while saving entry
   *   created while server offline.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The data fields belonging to this entry
   */
  fields: (ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node_fields | null)[];
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries {
  __typename: "EntryConnection";
  pageInfo: ExperienceConnectionPreFetchFragment_edges_node_entries_pageInfo;
  edges: (ExperienceConnectionPreFetchFragment_edges_node_entries_edges | null)[] | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (ExperienceConnectionPreFetchFragment_edges_node_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: ExperienceConnectionPreFetchFragment_edges_node_entries;
}

export interface ExperienceConnectionPreFetchFragment_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionPreFetchFragment_edges_node | null;
}

export interface ExperienceConnectionPreFetchFragment {
  __typename: "ExperienceConnection";
  edges: (ExperienceConnectionPreFetchFragment_edges | null)[] | null;
}