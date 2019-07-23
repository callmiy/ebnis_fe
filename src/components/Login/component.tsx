import React, {
  useReducer,
  Dispatch,
  useRef,
  useContext,
  useEffect,
  useMemo,
} from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";
import { WindowLocation, NavigateFn } from "@reach/router";

import "./styles.scss";
import {
  Props,
  ValidationSchema,
  reducer,
  ActionType,
  State,
  Action,
  initialState,
} from "./utils";
import { LoginUser as FormValues } from "../../graphql/apollo-types/globalTypes";
import { refreshToHome } from "../../refresh-to-app";
import { PasswordInput } from "../PasswordInput/component";
import { isConnected } from "../../state/connections";
import { noop } from "../../constants";
import { LoginMutationFn } from "../../graphql/login.mutation";
import { LoginMutation_login } from "../../graphql/apollo-types/LoginMutation";
import { SidebarHeader } from "../SidebarHeader";
import { ToOtherAuthLink } from "../ToOtherAuthLink";
import { scrollToTop } from "./scroll-to-top";
import { LayoutContext } from "../Layout/utils";
import { EXPERIENCES_URL } from "../../routes";
import { storeUser, getLoggedOutUser } from "../../state/users";
import { useUser } from "../use-user";

export function Login(props: Props) {
  const { login, location, navigate } = props;

  const [state, dispatch] = useReducer(reducer, initialState);

  const mainRef = useRef<HTMLDivElement>(null);

  const { persistor } = useContext(LayoutContext);

  const user = useUser();

  const {
    otherErrors,
    formErrors,
    serverFieldErrors,
    networkError,
    showPage,
  } = state;

  useEffect(() => {
    if (user) {
      (navigate as NavigateFn)(EXPERIENCES_URL);
    } else {
      dispatch([ActionType.setShowPage, true]);
    }
  }, [user, navigate]);

  const initialFormValues = useMemo(() => {
    const loggedOutUser = getLoggedOutUser();

    return loggedOutUser ? loggedOutUser : { email: "" };
  }, []);

  if (!showPage) {
    return null;
  }

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<FormValues>) {
    return (
      <Card>
        <Errors
          errors={{ otherErrors, formErrors, serverFieldErrors, networkError }}
          dispatch={dispatch}
        />

        <Card.Content>
          <Form
            onSubmit={async function onSubmit() {
              dispatch([ActionType.clearAllErrors]);

              if (!isConnected()) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setOtherErrors, "You are not connected"]);

                return;
              }

              formikBag.setSubmitting(true);

              const errors = await formikBag.validateForm(values);

              if (errors.email || errors.password) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setFormError, errors]);

                return;
              }

              try {
                const result = await (login as LoginMutationFn)({
                  variables: {
                    login: values,
                  },
                });

                const user = (result &&
                  result.data &&
                  result.data.login) as LoginMutation_login;

                storeUser(user);

                refreshToHome(persistor);
              } catch (error) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setServerErrors, error]);
              }
            }}
          >
            <FastField name="email" component={EmailInput} />

            <Field
              name="password"
              render={(f: FieldProps<FormValues>) => (
                <PasswordInput
                  {...f}
                  dispatch={dispatch}
                  pwdType={state.pwdType}
                  id="login-password"
                />
              )}
            />

            <Button
              id="login-submit"
              name="login-submit"
              disabled={!dirty || isSubmitting}
              loading={isSubmitting}
              type="submit"
              fluid={true}
              basic={true}
            >
              <Icon name="checkmark" /> Submit
            </Button>
          </Form>
        </Card.Content>

        <Card.Content extra={true}>
          <ToOtherAuthLink
            pathname={(location as WindowLocation).pathname}
            className="to-sign-up-button"
            name="to-sign-up"
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="components-login">
      <SidebarHeader title="Login to Ebnis" />

      <div className="main" ref={mainRef} id="components-login-main">
        <Formik
          initialValues={{
            email: initialFormValues.email,
            password: "",
          }}
          onSubmit={noop}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
}

function EmailInput(props: FieldProps<FormValues>) {
  const { field } = props;

  return (
    <Form.Field>
      <label htmlFor="email">Email</label>
      <Input {...field} type="email" autoComplete="off" id="login-email" />
    </Form.Field>
  );
}

function Errors(props: {
  errors: Pick<
    State,
    "formErrors" | "networkError" | "otherErrors" | "serverFieldErrors"
  >;
  dispatch: Dispatch<Action>;
}) {
  const { errors, dispatch } = props;

  const { otherErrors, formErrors, serverFieldErrors, networkError } = errors;

  let content = null;
  let id = "";

  if (otherErrors) {
    id = "other-errors";
    content = otherErrors;
  } else if (serverFieldErrors) {
    id = "server-field-errors";
    content = serverFieldErrors;
  } else if (networkError) {
    id = "network-error";
    content = networkError;
  } else if (formErrors) {
    id = "form-errors";
    const { email, password } = formErrors;

    content = (
      <>
        <span>Errors in fields: </span>

        {email && (
          <div className="field-error">
            <span>Email: </span>
            <span>{email}</span>
          </div>
        )}

        {password && (
          <div className="field-error">
            <span>Password: </span>
            <span>{password}</span>
          </div>
        )}
      </>
    );
  }

  return content ? (
    <Card.Content extra={true} id={id}>
      <Message
        error={true}
        onDismiss={function onDismiss() {
          dispatch([ActionType.clearAllErrors]);
        }}
      >
        <Message.Content>{content}</Message.Content>
      </Message>
    </Card.Content>
  ) : null;
}
