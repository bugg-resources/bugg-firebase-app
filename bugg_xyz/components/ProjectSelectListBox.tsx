import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import { useRouter } from "next/router";
import { Fragment, useCallback } from "react";
import classNames from "../classnames";
import { useAllProjects, useProject } from "../data/useProjects";
import { Project } from "../types";

export default function ProjectSelectListBox() {
  let projects = useAllProjects();
  let currentProject = useProject();

  if (!projects.length || !currentProject) {
    return null;
  }
  return (
    <SelctWithProjects
      projects={projects}
      currentProject={currentProject}
    ></SelctWithProjects>
  );
}

function SelctWithProjects(props: {
  projects: Project[];
  currentProject: Project;
}) {
  let router = useRouter();
  let setSelected = useCallback(
    (selected: Project) => {
      if (selected) {
        router.push({
          query: { project: selected.id },
        });
      }
    },
    [router]
  );

  return (
    <Listbox value={props.currentProject} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="mt-1 relative z-50">
            <Listbox.Button
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="text-gray-300 relative w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-borange focus:border-borange sm:text-sm"
            >
              <span className="block truncate">
                {props.currentProject.name}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <SelectorIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {props.projects.map((project) => (
                  <Listbox.Option
                    key={project.id}
                    className={({ active }) =>
                      classNames(
                        active ? "text-white bg-borange" : "text-gray-900",
                        "cursor-default select-none relative py-2 pl-3 pr-9"
                      )
                    }
                    value={project}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {project.name}
                        </span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-borange",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
