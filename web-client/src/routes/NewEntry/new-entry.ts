import { RouteComponentProps } from "react-router-dom";

import { AppRouteProps } from "../../containers/App/app";
import { GetExpGqlProps } from "../../graphql/get-exp.query";
import { NewEntryRouteParams } from "../../Routing";
import { CreateEntryGqlProps } from "../../graphql/create-entry.mutation";

export type OwnProps = AppRouteProps & RouteComponentProps<NewEntryRouteParams>;

export type Props = OwnProps & GetExpGqlProps & CreateEntryGqlProps;

export type FormObjVal = Date | string;
export type FormObj = { [k: string]: FormObjVal };

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
}