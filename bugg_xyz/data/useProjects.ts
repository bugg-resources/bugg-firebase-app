import firebase from "firebase/app";
import { doc, getFirestore, onSnapshot, Unsubscribe } from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useReducer, useState } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { Project } from "../types";
import { useHasFirebaseAppLoaded } from "./initialise-firebase";
import { useCurrentProfile } from "./useAuth";

export const currentProjectIdAtom = atom({
  key: "currentProjectIdAtom",
  default: null as null | string,
});

export const currentProjectAtom = atom({
  key: "currentProjectAtom",
  default: null as null | Project,
});

export const allProjectsAtom = atom({
  key: "allProjectsAtom",
  default: [] as Project[],
});

/***
 * Fetch and watch a project from Firestore
 */
export function useProject() {
  return useRecoilValue(currentProjectAtom);
}

export function useProjectId() {
  return useRecoilValue(currentProjectIdAtom);
}

export function useAllProjects() {
  return useRecoilValue(allProjectsAtom);
}

function reducer(
  state: { [projectId: string]: Project },
  action: { type: string; project?: Project; projectId?: string }
) {
  switch (action.type) {
    case "delete": {
      let newState = Object.assign({}, state);
      delete newState[action.projectId!];
      return newState;
    }
    case "onSnapshot":
      return Object.assign({}, state, {
        [action.project!.id]: action.project,
      });

    default:
      return state;
  }
}

export function ProjectsWatcher() {
  let router = useRouter();
  let selectedProjectId =
    typeof router.query.project === "string" ? router.query.project : null;

  let hasAppLoaded = useHasFirebaseAppLoaded();
  let profile = useCurrentProfile();
  let [projectId, setProjectId] = useRecoilState(currentProjectIdAtom);
  let [currentProject, setProject] = useRecoilState(currentProjectAtom);
  let allProjectIds = profile ? profile.projects : null;

  let [allProjects, setRecoilAllProjects] = useRecoilState(allProjectsAtom);

  const [projectsById, dispatch] = useReducer(reducer, {});
  // Load in all the projects the user has
  useEffect(() => {
    if (!hasAppLoaded) {
      return;
    }

    let unsubs = [] as Unsubscribe[];
    for (let id of allProjectIds || []) {
      let unsub = onSnapshot(doc(getFirestore(), `projects/${id}`), (snap) => {
        if (!snap.exists) {
          dispatch({
            type: "delete",
            projectId: id,
          });
        } else {
          dispatch({
            type: "onSnapshot",
            project: snap.data() as Project,
          });
        }
      });

      unsubs.push(unsub);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [allProjectIds, dispatch]);

  useEffect(() => {
    setRecoilAllProjects(Object.keys(projectsById).map((k) => projectsById[k]));
  }, [projectsById, setRecoilAllProjects]);

  // set the current project when the ID is set
  useEffect(() => {
    if (!projectId || !hasAppLoaded || !allProjects.length) {
      setProject(null);
      return;
    }

    let p = allProjects.find((p) => p.id === projectId) || null;
    setProject(p);

    return () => {
      setProject(null);
    };
  }, [projectId, hasAppLoaded, setProject, allProjects]);

  // Set the project ID
  useEffect(() => {
    if (!profile) {
      setProjectId(null);
      return;
    }

    if (selectedProjectId) {
      if (profile.projects.includes(selectedProjectId)) {
        setProjectId(selectedProjectId);
      }
      return;
    }

    if (!profile.projects.length) {
      // the user doesn't have a project
      return;
    }

    // Check local storage to see which project they selected before
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== undefined
    ) {
      let localProjectId = window.localStorage.getItem("bugg-project");

      if (localProjectId) {
        if (profile.projects.includes(localProjectId)) {
          setProjectId(localProjectId);
        }
        return;
      }
    }

    // Just select the first project in the list
    setProjectId(profile.projects[0]);
  }, [profile, selectedProjectId]);

  useEffect(() => {
    if (!currentProject) {
      return;
    }

    // Update localstorage to remember the last selected project
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== undefined
    ) {
      window.localStorage.setItem("bugg-project", currentProject.id);
    }
  }, [currentProject]);

  return null;
}
