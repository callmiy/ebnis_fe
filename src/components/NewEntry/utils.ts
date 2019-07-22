import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";

import { NewEntryRouteParams } from "../../routes";
import { CreateEntryMutationProps } from "../../graphql/create-entry.mutation";
import { WithApolloClient } from "react-apollo";
import { CreateUnsavedEntryMutationProps } from "./resolvers";
import {
  ExperienceFragment,
  ExperienceFragment_fieldDefs,
} from "../../graphql/apollo-types/ExperienceFragment";
import immer from "immer";
import { ApolloError } from "apollo-client";
import { FieldType } from "../../graphql/apollo-types/globalTypes";

export interface OwnProps
  extends WithApolloClient<{}>,
    RouteComponentProps<NewEntryRouteParams> {
  experience: ExperienceFragment;
}

export interface Props
  extends OwnProps,
    CreateEntryMutationProps,
    CreateUnsavedEntryMutationProps {}

export type FormObjVal = Date | string | number;

// the keys are the indices of the field definitions and the values are the
// default values for each field data type e.g number for integer and date
// for date
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  formFieldName: string;
  dispatch: DispatchType;
  value: FormObjVal;
}

export type ToString = (val: FormObjVal) => string;

export function initialStateFromProps(experience: ExperienceFragment) {
  const fieldDefs = experience.fieldDefs as ExperienceFragment_fieldDefs[];

  const formObj = fieldDefs.reduce(
    function fieldDefReducer(acc, field, index) {
      const value =
        field.type === FieldType.DATE || field.type === FieldType.DATETIME
          ? new Date()
          : "";

      acc[index] = value;

      return acc;
    },
    {} as FormObj,
  );

  return {
    formObj,
    fieldErrors: {},
  };
}

export function makePageTitle(exp: ExperienceFragment | null | undefined) {
  return "[New Entry] " + ((exp && exp.title) || "entry");
}

export function formFieldNameFromIndex(index: number) {
  return `fields[${index}]`;
}

function formFieldNameToIndex(formFieldName: string) {
  const index = (/fields.+(\d+)/.exec(formFieldName) as RegExpExecArray)[1];

  return index;
}

export enum ActionTypes {
  setFormObjField = "@components/new-entry/set-form-obj-field",
  setServerErrors = "@components/new-entry/set-server-errors",
  removeServerErrors = "@components/new-entry/unset-server-errors",
}

interface SetFormObjFieldPayload {
  formFieldName: string;
  value: FormObjVal;
}

interface FieldErrors {
  [k: string]: string;
}

interface ServerErrors {
  networkError?: string;
  fieldErrors?: FieldErrors;
}

export interface State {
  readonly formObj: FormObj;
  readonly fieldErrors: FieldErrors;
  readonly networkError?: string | null;
}

type Action =
  | [ActionTypes.setFormObjField, SetFormObjFieldPayload]
  | [ActionTypes.setServerErrors, ServerErrors]
  | [ActionTypes.removeServerErrors];

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionTypes.setFormObjField:
        {
          const { formFieldName, value } = payload as SetFormObjFieldPayload;

          proxy.formObj[formFieldNameToIndex(formFieldName)] = value;
        }

        break;

      case ActionTypes.setServerErrors:
        {
          const { fieldErrors, networkError } = payload as ServerErrors;

          if (fieldErrors) {
            proxy.fieldErrors = fieldErrors;
          } else if (networkError) {
            proxy.networkError = networkError;
          }
        }

        break;

      case ActionTypes.removeServerErrors:
        {
          proxy.networkError = null;
          proxy.fieldErrors = {};
        }

        break;
    }
  });
};

export function parseApolloErrors(payload: ApolloError) {
  const { graphQLErrors, networkError } = payload as ApolloError;

  if (networkError) {
    return { networkError: "Network error!" };
  }

  try {
    const { fields } = JSON.parse(
      graphQLErrors[0].message,
    ) as CreateEntryFieldErrors;

    const fieldErrors = fields.reduce((acc, field) => {
      const [[k, v]] = Object.entries(field.errors);

      acc[field.meta.def_id] = `${k}: ${v}`;
      return acc;
    }, {});

    return { fieldErrors };
  } catch (error) {
    return { networkError: "Network error!" };
  }
}

export type DispatchType = Dispatch<Action>;

export interface CreateEntryFieldErrors {
  fields: {
    errors: {
      data: string;
    };

    meta: {
      def_id: string;
      index: number;
    };
  }[];
}
