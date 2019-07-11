/* eslint-disable @typescript-eslint/no-explicit-any */
import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading";

export const NewEntry = Loadable({
  loader: () => import("../NewEntry"),
  loading: LoadableLoading,
}) as any;

export const ExperienceRoute = Loadable({
  loader: () => import("../ExperienceRoute"),
  loading: LoadableLoading,
}) as any;
