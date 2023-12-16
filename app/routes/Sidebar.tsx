import React, { useState } from "react";
import { Link } from "@remix-run/react";
import { Bars3Icon } from "@heroicons/react/24/outline";

export const Sidebar = ({ pageType, setPageType }) => {
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const handlePageChange = (newPageType) => {
    setPageType(newPageType);
  };
  return (
    <>
      <button
        onClick={() => {
          setDisplaySidebar(true);
        }}
        className="absolute bottom-8 right-10 bg-opacity-50 bg-black p-2 rounded-full"
      >
        <Bars3Icon className="h-6 w-6 text-white" />
      </button>{" "}
      <div
        className={`md:flex ${
          displaySidebar ? "flex fixed top-1 left-1 bottom-1 right-4" : "hidden"
        }  md:w-[12.5%] text-base items-center flex-col md:h-[98%]  bg-gray-950 dark:bg-gray-800 md:ml-1 rounded-3xl text-white`}
      >
        <button
          onClick={() => {
            setDisplaySidebar(false);
          }}
          className="absolute top-10 right-10 md:hidden w-6 h-6"
        >
          x
        </button>
        <div className="flex text-xl justify-center items-center w-full h-16 font-extrabold">
          MOSHI
        </div>
        <Link
          to="/"
          className={`${
            pageType === "dashboard" ? "bg-gray-800 dark:bg-gray-900" : ""
          } py-3 px-12 rounded-2xl`}
          onClick={() => handlePageChange("dashboard")}
        >
          Dashboard
        </Link>
        <Link
          to="/analytics"
          className={`${
            pageType === "analytics" ? "bg-gray-800 dark:bg-gray-900" : ""
          } py-3 px-12 rounded-2xl`}
          onClick={() => handlePageChange("analytics")}
        >
          Analytics
        </Link>
        <Link
          to="/tracking"
          className={`${
            pageType === "tracking" ? "bg-gray-800 dark:bg-gray-900" : ""
          } py-3 px-12 rounded-2xl`}
          onClick={() => handlePageChange("tracking")}
        >
          Tracking
        </Link>
      </div>
    </>
  );
};
