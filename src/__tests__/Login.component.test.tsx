/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { Login } from "../components/Login/component";
import { Props } from "../components/Login/utils";
import { renderWithRouter, fillField } from "./test_utils";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

jest.mock("../state/connections");
jest.mock("../refresh-to-app");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null),
}));
jest.mock("../components/Login/scroll-to-top");
jest.mock("../state/users");
jest.mock("../components/use-user");

import { refreshToHome } from "../refresh-to-app";
import { scrollToTop } from "../components/Login/scroll-to-top";
import { EXPERIENCES_URL } from "../routes";
import { getLoggedOutUser, storeUser } from "../state/users";
import { useUser } from "../components/use-user";
import { isConnected } from "../state/connections";

const mockRefreshToHome = refreshToHome as jest.Mock;
const mockIsConnected = isConnected as jest.Mock;
const mockScrollToTop = scrollToTop as jest.Mock;
const mockGetLoggedOutUser = getLoggedOutUser as jest.Mock;
const mockStoreUser = storeUser as jest.Mock;
const mockUseUser = useUser as jest.Mock;

it("renders correctly and submits", async () => {
  /**
   * Given that server will return a valid user after form submission
   */
  const user = {};
  const { ui, mockLogin } = makeComp();

  mockLogin.mockResolvedValue({
    data: {
      login: user,
    },
  });

  /**
   * When we start to use the login component
   */
  render(ui);

  /**
   * Then email field should be empty
   */
  const $email = document.getElementById("login-email") as any;
  expect($email.value).toBe("");

  /**
   * Then the submit button should be disabled
   */
  const $button = document.getElementById("login-submit") as HTMLButtonElement;
  expect($button.disabled).toBe(true);

  /**
   * When the form is correctly completed
   */
  fillField($email, "me@me.com");
  fillField(document.getElementById("login-password") as any, "awesome pass");

  /**
   * Then the submit button should be enabled
   */
  expect($button.disabled).toBe(false);

  /**
   * When we submit the form
   */
  fireEvent.click($button);

  /**
   * Then the correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockLogin).toBeCalledWith({
        variables: {
          login: {
            email: "me@me.com",
            password: "awesome pass",
          },
        },
      }),
    { interval: 1 },
  );

  /**
   * And user should be saved on the client
   */
  expect(mockStoreUser).toBeCalledWith(user);

  /**
   * And we should be redirected
   */
  expect(mockRefreshToHome).toBeCalled();

  /**
   * And page should not be scrolled to top
   */
  expect(mockScrollToTop).not.toBeCalled();
});

it("renders error if socket not connected", async () => {
  /**
   * Given that server is not connected
   */
  const { ui } = makeComp({ isConnected: false });

  /**
   * When we start using the login component
   */
  render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(document.getElementById("other-errors")).toBeNull();

  /**
   * When we complete and submit the form
   */
  fillForm();

  /**
   * Then we should see an error about not being connected
   */
  const $error = await waitForElement(() =>
    document.getElementById("other-errors"),
  );

  expect($error).not.toBeNull();

  /**
   * And page should be scrolled to top
   */
  expect((mockScrollToTop.mock.calls[0][0] as HTMLElement).id).toEqual(
    "components-login-main",
  );
});

it("renders error if email is invalid", async () => {
  const { ui } = makeComp();

  /**
   * Given that we are using the login component
   */
  render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(document.getElementById("form-errors")).toBeNull();

  /**
   * When we complete the form with invalid email and submit
   */
  fillField(document.getElementById("login-email") as any, "invalid email");
  fillField(document.getElementById("login-password") as any, "awesome pass");
  fireEvent.click(document.getElementById("login-submit") as any);

  /**
   * Then we should see an error UI
   */
  const $error = await waitForElement(() =>
    document.getElementById("form-errors"),
  );
  expect($error).not.toBeNull();
});

it("renders error if password is invalid", async () => {
  const { ui } = makeComp();

  /**
   * Given that we are using the login component
   */
  render(ui);

  /**
   * When we complete the form with wrong password and submit
   */
  fillField(document.getElementById("login-email") as any, "awesome@email.com");
  fillField(document.getElementById("login-password") as any, "12");
  fireEvent.click(document.getElementById("login-submit") as any);

  /**
   * Then we should see an error about the wrong password
   */
  const $error = await waitForElement(() =>
    document.getElementById("form-errors"),
  );

  expect($error).not.toBeNull();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders error if server returns field errors", async () => {
  /**
   * Given that server will return field errors
   */
  const { ui, mockLogin } = makeComp();

  mockLogin.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError(`{"error":"Invalid email/password"}`)],
    }),
  );

  /**
   * Given that we are using the login component
   */
  render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(document.getElementById("server-field-errors")).toBeNull();

  /**
   * When we complete and submit the form, but server returns an error
   */
  fillForm();

  /**
   * Then we should see an error message
   */
  const $error = await waitForElement(
    () => document.getElementById("server-field-errors") as HTMLElement,
  );
  expect($error).not.toBeNull();

  /**
   * When we click on close button of error UI
   */
  fireEvent.click($error.querySelector(`.close.icon`) as any);

  /**
   * Then the error UI should no longer be visible
   */
  expect(document.getElementById("server-field-errors")).toBeNull();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders error if server returns network errors", async () => {
  const { ui, mockLogin } = makeComp();

  /**
   * Given that server will return network error
   */
  mockLogin.mockRejectedValue(
    new ApolloError({
      networkError: new Error("network error"),
    }),
  );

  /**
   * When we start to use the login component
   */
  render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(document.getElementById("network-error")).toBeNull();

  /**
   * When we complete and submit the form
   */
  fillForm();

  /**
   * Then we should see an error message
   */
  const $error = await waitForElement(() =>
    document.getElementById("network-error"),
  );

  expect($error).not.toBeNull();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("pre-fills form with user data", async () => {
  /**
   * Given user has logged out
   */

  const { ui } = makeComp();

  mockGetLoggedOutUser.mockReturnValue({
    email: "me@me.com",
  });

  /**
   * When we start to use the login component
   */
  render(ui);

  /**
   * Then email input should be pre-filled with user email
   */
  expect((document.getElementById("login-email") as any).value).toBe(
    "me@me.com",
  );
});

it("navigates to 'my experiences page' if user is logged in", async () => {
  /**
   * Given user has logged out
   */

  const { ui, mockNavigate } = makeComp();

  mockUseUser.mockReturnValue({});

  /**
   * When we start to use the login component
   */
  render(ui);

  expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function fillForm() {
  fillField(document.getElementById("login-email") as any, "me@me.com");
  fillField(document.getElementById("login-password") as any, "awesome pass");
  fireEvent.click(document.getElementById("login-submit") as any);
}

const LoginP = Login as ComponentType<Partial<Props>>;

function makeComp({
  isConnected = true,
  props = {},
}: { isConnected?: boolean; props?: Partial<Props> } = {}) {
  mockScrollToTop.mockReset();
  mockIsConnected.mockReset();
  mockStoreUser.mockReset();
  mockGetLoggedOutUser.mockReset();
  mockUseUser.mockReset();
  mockIsConnected.mockReturnValue(isConnected);

  const mockLogin = jest.fn();
  const { Ui, ...rest } = renderWithRouter(LoginP);

  return {
    ui: <Ui login={mockLogin} {...props} />,
    ...rest,
    mockLogin,
  };
}
