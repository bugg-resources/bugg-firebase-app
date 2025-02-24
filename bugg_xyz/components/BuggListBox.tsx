/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import classNames from "../classnames";

interface BuggListBoxProps<T> {
  items: (T | null)[];
  selected: T | null;
  setSelected: (item: T | null) => void;

  getItemKey: (item: T | null) => string;
  getItemTitle: (item: T | null) => string;
  getItemSubtitle?: (item: T | null) => string;
}

export default function BuggListBox<T>(props: BuggListBoxProps<T>) {
  let {
    items,
    selected,
    setSelected,
    getItemKey,
    getItemTitle,
    getItemSubtitle,
  } = props;

  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="mt-1 relative">
            <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-borange focus:border-borange sm:text-sm">
              <span className="w-full inline-flex truncate">
                <span className="truncate">{getItemTitle(selected)}</span>
                {getItemSubtitle && (
                  <span className="ml-2 truncate text-gray-500">
                    {getItemSubtitle(selected)}
                  </span>
                )}
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
                {items.map((item) => (
                  <Listbox.Option
                    key={getItemKey(item)}
                    className={({ active }) =>
                      classNames(
                        active ? "text-white bg-borange" : "text-gray-900",
                        "cursor-default select-none relative py-2 pl-3 pr-9"
                      )
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex">
                          <span
                            className={classNames(
                              selected ? "font-semibold" : "font-normal",
                              "truncate"
                            )}
                          >
                            {getItemTitle(item)}
                          </span>
                          {getItemSubtitle && (
                            <span
                              className={classNames(
                                active ? "text-borange" : "text-gray-500",
                                "ml-2 truncate"
                              )}
                            >
                              {getItemSubtitle(item)}
                            </span>
                          )}
                        </div>

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
