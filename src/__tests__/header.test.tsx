import React from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";
import { Header } from "../components/Header/header-x";

const title = "My App title";

it("renders with sidebar, and no wide", () => {
  /**
   * Given we are using header component
   */
  const { getByTestId, container, getByText } = render(
    <Header title={title} sidebar={true} />
  );

  /**
   * Then header should not contain 'wide' class name
   */
  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");

  const sidebarTrigger = getByTestId("sidebar-trigger");
  expect(header).toContainElement(sidebarTrigger);

  const $titleContainer = getByTestId("app-header-title");
  expect($titleContainer.classList).not.toContain("no-sidebar");

  const $title = getByText(title);
  expect($title.classList).toContain("title_text");
});

it("Header component if we have sidebar, then wide has no effect", () => {
  const { container } = render(
    <Header title={title} sidebar={true} wide={true} />
  );

  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");
});

it("Header component if no sidebar, then wide has effect", () => {
  const { container } = render(<Header title={title} wide={true} />);

  const header = container.firstChild as HTMLElement;
  expect(header.classList).toContain("wide");
});

it("renders with logo, title, no sidebar, no wide", () => {
  const {
    queryByTestId,
    getByAltText,
    getByText,
    getByTestId,
    container
  } = render(<Header title={title} />);

  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");

  expect(getByAltText(/logo/i)).toBeInTheDocument();

  expect(queryByTestId("sidebar-trigger")).not.toBeInTheDocument();

  const $titleContainer = getByTestId("app-header-title");
  expect($titleContainer.classList).toContain("no-sidebar");

  const $title = getByText(title);
  expect($title.classList).not.toContain("title_text");
});