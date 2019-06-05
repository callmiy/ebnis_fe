// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";

import { MyExperiences } from "../components/MyExperiences/component";
import { Props } from "../components/MyExperiences/utils";
import { renderWithRouter } from "./test_utils";
import { GetExps_exps } from "../graphql/apollo-types/GetExps";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

it("renders loading state and not main", () => {
  const { Ui } = makeComp({
    getExpDefsResult: { loading: true } as any
  });

  const { getByTestId, queryByTestId } = render(<Ui />);

  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(queryByTestId("home-route-main")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();
});

it("does not render empty experiences", () => {
  const { Ui } = makeComp({ getExpDefsResult: {} as any });

  const props: Props = { exps: [] } as any;
  const { getByText, queryByTestId } = render(<Ui {...props} />);

  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();

  expect(
    getByText(/Click here to create your first experience/)
  ).toBeInTheDocument();
});

it("renders experiences from server", () => {
  const [id1, id2] = [new Date(), new Date()].map((d, index) =>
    (d.getTime() + index).toString()
  );

  const exps = [
    {
      id: id1,
      description: "lovely experience description 1",
      title: "love experience title 1"
    },

    {
      id: id2,
      title: "love experience title 2",
      description: null
    }
  ] as GetExps_exps[];

  const { Ui } = makeComp({ getExpDefsResult: { exps } as any });

  const { queryByText, getByText, queryByTestId, getByTestId } = render(<Ui />);

  expect(getByText("love experience title 2")).toBeInTheDocument();
  expect(queryByTestId(`exp-toggle-${id2}`)).not.toBeInTheDocument();

  const $exp1 = getByText("love experience title 1");
  expect($exp1).toBeInTheDocument();

  let $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");

  fireEvent.click($expToggle);
  $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle.classList).toContain("down");
  expect($expToggle.classList).not.toContain("right");
  expect(getByText("lovely experience description 1")).toBeInTheDocument();

  fireEvent.click($expToggle);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");
  expect(
    queryByText("lovely experience description 1")
  ).not.toBeInTheDocument();
});

it("renders unsaved and saved experiences", () => {
  /**
   * Given that client has 2 unsaved experiences and 1 saved experience
   */
  const unsavedExperiences = [
    {
      id: "1",
      title: "1"
    },

    {
      id: "2",
      title: "2"
    }
  ] as GetExps_exps[];

  const exps = [
    {
      id: "3",
      title: "3"
    }
  ] as GetExps_exps[];

  const { Ui } = makeComp({
    unsavedExperiences: unsavedExperiences as any,
    getExpDefsResult: { exps } as any
  });

  /**
   * When we use the component
   */
  const { getAllByTestId } = render(<Ui />);

  /**
   * Then we should only see 3 experiences
   */
  expect(getAllByTestId(/experience-main-/).length).toBe(3);
});

it("renders offline experiences when server unavailable", async () => {
  /**
   * Given server is unavailable
   */
  const { Ui, mockQuery } = makeComp({
    getExpDefsResult: {
      loading: true,
      networkStatus: 1
    } as any,

    isConnected: false
  });

  /**
   * When we use the component
   */
  render(<Ui />);

  /**
   * Then we should load experiences from user cache
   */
  await wait(() => {
    expect((mockQuery.mock.calls[0][0] as any).query).not.toBeUndefined();
  });
});

it("loads entries in the background when experiences are loaded", () => {
  /**
   * Given there are experiences in the system
   */
  const exps = [
    {
      id: "1",
      title: "1"
    },

    {
      id: "2",
      title: "2"
    }
  ] as GetExps_exps[];

  const { Ui, mockQuery } = makeComp({ getExpDefsResult: { exps } as any });

  /**
   * When we use the component
   */
  render(<Ui />);

  /**
   * Then we should load entries for the experiences in the background
   */

  expect(
    (mockQuery.mock.calls[0][0] as any).variables.input.experiencesIds
  ).toEqual(["1", "2"]);
});

function makeComp({
  getExpDefsResult = {} as any,
  ...props
}: Partial<Props> = {}) {
  const mockQuery = jest.fn();
  const client = {
    query: mockQuery
  } as any;

  const { Ui, ...rest } = renderWithRouter(
    MyExperiencesP,
    {},
    {
      getExpDefsResult,
      client,
      ...props
    }
  );

  return { Ui, mockQuery, ...rest };
}
