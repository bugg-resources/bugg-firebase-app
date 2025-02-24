import { Disclosure, Menu, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { useRouter } from "next/router";
import { Fragment, useMemo } from "react";
import classNames from "../classnames";
import { useCurrentAuthProfile, useCurrentProfile } from "../data/useAuth";
import ProjectSelectListBox from "./ProjectSelectListBox";

const userNavigation = [{ name: "Sign out", href: "/signout" }];

export default function NavBar() {
  let currentProfile = useCurrentProfile();
  let authProfile = useCurrentAuthProfile();

  let route = useRouter();

  const navigation = useMemo(
    () => { 
      const baseNavigation = [
        { name: "Manager", href: "/", current: route.pathname === "/" },
        {
          name: "Stream",
          href: "/stream",
          current: route.pathname === "/stream",
        },
        {
          name: "Configurations",
          href: "/configurations",
          current: route.pathname === "/configurations",
        },
        {
          name: "Export",
          href: "/export",
          current: route.pathname === "/export",
        },
      ];
      if (currentProfile?.isAdmin) {
        baseNavigation.push({
          name: "Admin",
          href: "/admin",
          current: route.pathname === "/admin",
        });
      }

      return baseNavigation;    
    },
    [route, currentProfile]
  );

  return (
    <Disclosure as="nav" className="bg-bgravel-100">
      {({ open }) => (
        <>
          <div className=" px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10"
                    src="./bugg-icon.svg"
                    alt="Bugg Icon"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-bgravel-200 text-white"
                            : "text-white hover:bg-bgravel-100 hover:bg-opacity-75",
                          "px-3 py-2 rounded-md text-sm font-medium"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mx-6 flex-1 flex justify-center px-2 lg:ml-6 lg:mr-0 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <ProjectSelectListBox></ProjectSelectListBox>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  {/* Profile dropdown */}
                  <Menu as="div" className="ml-3 relative z-20">
                    <div>
                      <Menu.Button className="z-10 max-w-xs bg-bgravel-100 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-borange focus:ring-white">
                        <span className="sr-only">Open user menu</span>
                        {authProfile?.photoURL && (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={authProfile?.photoURL}
                            alt=""
                          />
                        )}

                        {!authProfile?.photoURL && (
                          <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                            <svg
                              className="h-full w-full text-gray-300"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </span>
                        )}
                      </Menu.Button>
                    </div>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>

              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="bg-bgravel-100 inline-flex items-center justify-center p-2 rounded-md text-orange-100 hover:text-white hover:bg-bgravel-100 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-borange focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-bgravel-200 text-white"
                      : "text-white hover:bg-bgravel-100 hover:bg-opacity-75",
                    "block px-3 py-2 rounded-md text-base font-medium"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-borange">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  {authProfile?.photoURL && (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={authProfile?.photoURL}
                      alt=""
                    />
                  )}

                  {!authProfile?.photoURL && (
                    <span className="inline-block h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                      <svg
                        className="h-full w-full text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">
                    {currentProfile?.displayName}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                {userNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-bgravel-100 hover:bg-opacity-75"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
