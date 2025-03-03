"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../config";

const products = [
  { name: "Rename", href: "#" },
  { name: "Download", href: "#" },
  { name: "Share", href: "#" },
  { name: "Import", href: "#" },
  { name: "Open", href: "#" },
];

const helpOptions = [
  { name: "Privacy Policy", href: "/Privacy_Policy.pdf", target: "_blank" },
  {
    name: "Terms and Conditions",
    href: "/Privacy_Policy.pdf",
    target: "_blank",
  },
];

const functionsOptions = [
  { name: "SUM", href: "#" },
  { name: "MIN", href: "#" },
  { name: "MAX", href: "#" },
  { name: "AVERAGE", href: "#" },
  { name: "COUNT", href: "#" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sheetName, setSheetName] = useState("Untitled Sheet");
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0); // Auto-focus input
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/auth/userDetails`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add the token here
          },
          credentials: "include", // You can keep this for cookies as well
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to fetch user details");

        console.log("User details:", data);
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);
  // Save new name on Enter or blur
  const handleSave = () => {
    setIsEditing(false);
    if (!sheetName.trim()) setSheetName("Untitled Sheet"); // Default name if empty
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Ensures cookies are sent
      });

      if (response.ok) {
        window.location.href = "/login"; // Redirect to login page
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="fixed top-0 w-full  mb-10 bg-white shadow-md border-b border-gray-200">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8"
      >
        <div className="flex lg:flex-1 items-center">
          <h3 className="text-black text-xl font-semibold mr-2">Sheets</h3>
          {isEditing ? (
            <input
              ref={inputRef}
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="ml-2 text-gray-600 text-sm border rounded px-2 py-1 focus:outline-none"
            />
          ) : (
            <h6
              className="ml-2 text-gray-600 text-sm cursor-pointer hover:underline"
              onClick={handleEditClick}
            >
              {sheetName}
            </h6>
          )}
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <Bars3Icon className="size-6" aria-hidden="true" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-gray-900">
              Files
              <ChevronDownIcon className="size-5 text-gray-400" />
            </PopoverButton>
            <PopoverPanel className="absolute top-full -left-8 z-[60] mt-3 w-screen max-w-xs overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
              <div className="p-4">
                <a
                  onClick={handleEditClick}
                  className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  Rename
                </a>
                <a
                  href="#"
                  className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  Download
                </a>
                <a
                  href="#"
                  className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  Share
                </a>
                <a
                  href="#"
                  className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  Import
                </a>
                <a
                  href="#"
                  className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  Open
                </a>
              </div>
            </PopoverPanel>
          </Popover>
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-gray-900">
              Help
              <ChevronDownIcon className="size-5 text-gray-400" />
            </PopoverButton>
            <PopoverPanel className="absolute top-full -left-8 z-[60] mt-3 w-screen max-w-xs overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
              <div className="p-4">
                {helpOptions.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target={item.target || "_self"}
                    rel="noopener noreferrer"
                    className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </PopoverPanel>
          </Popover>
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-gray-900">
              Functions
              <ChevronDownIcon className="size-5 text-gray-400" />
            </PopoverButton>
            <PopoverPanel className="absolute top-full -left-8 z-[60] mt-3 w-screen max-w-xs overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
              <div className="p-4">
                {functionsOptions.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block p-2 text-gray-900 hover:bg-gray-50 rounded-lg"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </PopoverPanel>
          </Popover>
          <a href="#" className="text-sm font-semibold text-gray-900">
            Features
          </a>
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-gray-900">
              {user?.name}
              <ChevronDownIcon className="size-5 text-gray-400" />
            </PopoverButton>
            <PopoverPanel className="absolute top-full right-0 z-[60] mt-3 w-48 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/5">
              <div className="p-2">
                <p className="px-4 py-2 text-gray-900">{user?.name}</p>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </PopoverPanel>
          </Popover>
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-[70]" />
        <DialogPanel className="fixed inset-y-0 right-0 z-[80] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <h3 className="text-black text-xl font-semibold">Sheets</h3>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <XMarkIcon className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {products.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block rounded-lg py-2 px-3 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                <Popover className="relative">
                  <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-gray-900">
                    {user?.name}
                    <ChevronDownIcon className="size-5 text-gray-400" />
                  </PopoverButton>
                  <PopoverPanel className="absolute top-full right-0 z-[60] mt-3 w-48 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/5">
                    <div className="p-2">
                      <p className="px-4 py-2 text-gray-900">{user?.name}</p>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  </PopoverPanel>
                </Popover>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
