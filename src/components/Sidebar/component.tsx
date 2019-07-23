import React, { Dispatch, MouseEventHandler, SetStateAction } from "react";
import { RouteComponentProps, NavigateFn, WindowLocation } from "@reach/router";
import makeClassNames from "classnames";

import "./styles.scss";
import {
  EXPERIENCE_DEFINITION_URL,
  EXPERIENCES_URL,
  LOGIN_URL,
} from "../../routes";
import { clearUser } from "../../state/users";
import { useUser } from "../use-user";

export interface Props extends RouteComponentProps {
  show: boolean;
  toggleShowSidebar: Dispatch<SetStateAction<boolean>>;
}

const blockClicks: MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const { location, show, toggleShowSidebar, navigate } = props;
  const user = useUser();

  const pathname = (location as WindowLocation).pathname;

  function hideSidebar() {
    toggleShowSidebar(false);
  }

  function onGoToExperience(where: string) {
    return function goToExperience() {
      hideSidebar();
      (navigate as NavigateFn)(where);
    };
  }

  return (
    <aside
      id="app-sidebar"
      className={makeClassNames({ "components-sidebar": true, visible: show })}
      onClick={hideSidebar}
    >
      <nav className="container" id="sidebar-container" onClick={blockClicks}>
        <div
          className="sidebar-hide item"
          id="sidebar-hide"
          onClick={hideSidebar}
        />

        <ul className="sidebar__content up">
          {pathname !== EXPERIENCES_URL && (
            <li
              className="sidebar__item"
              onClick={onGoToExperience(EXPERIENCES_URL)}
              id="side-bar-my-experiences-link"
            >
              My Experiences
            </li>
          )}

          {pathname !== EXPERIENCE_DEFINITION_URL && (
            <li
              className="sidebar__item"
              onClick={onGoToExperience(EXPERIENCE_DEFINITION_URL)}
              id="sidebar-new-experience-definition-link"
            >
              New Experience Definition
            </li>
          )}
        </ul>

        <ul className="sidebar__content down">
          <li
            className="sidebar__item sidebar__item--down-first-child"
            onClick={() => {
              // istanbul ignore next:
              if (typeof window !== "undefined") {
                // istanbul ignore next:
                window.location.reload();
              }
            }}
          >
            Refresh
          </li>

          {user && (
            <li
              className="sidebar__item"
              onClick={() => {
                clearUser();

                (navigate as NavigateFn)(LOGIN_URL);
              }}
              id="sidebar-logout-link"
            >
              Log out
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
