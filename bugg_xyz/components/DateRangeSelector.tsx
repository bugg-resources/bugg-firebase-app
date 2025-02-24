import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import classNames from "../classnames";

const dateRanges = [
  { id: 1, name: "24 Hours" },
  { id: 7, name: "7 Days   " },
  { id: 30, name: "30 Days  " },
  // { id: 365, name: "1 Year   " },
];

interface DateRangeSelectorProps {
  daysToSearch: number;
  setDaysToSearch: (daysToSearch: number) => void;
}

export default function DateRangeSelector(props: DateRangeSelectorProps) {
  let selected = dateRanges.find((d) => d.id === props.daysToSearch)!;

  return (
    <Listbox
      value={selected}
      onChange={(range) => props.setDaysToSearch(range.id)}
    >
      {({ open }) => (
        <>
          <div className="mt-1 relative min-w-max" style={{ minWidth: "9rem" }}>
            <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 px-4 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-borange focus:border-borange sm:text-sm">
              <span className="block truncate">{selected.name}</span>
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
                {dateRanges.map((range) => (
                  <Listbox.Option
                    key={range.id}
                    className={({ active }) =>
                      classNames(
                        active ? "text-white bg-borange" : "text-gray-900",
                        "cursor-default select-none relative py-2 pl-8 pr-4"
                      )
                    }
                    value={range}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {range.name}
                        </span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-borange",
                              "absolute inset-y-0 left-0 flex items-center pl-1.5"
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
