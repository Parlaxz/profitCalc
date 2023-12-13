import React from "react";
import { Link } from "@remix-run/react";

export const Sidebar = ({ pageType, setPageType }) => {
  const handlePageChange = (newPageType) => {
    setPageType(newPageType);
  };
  return (
    <div className="md:flex hidden text-base items-center flex-col h-[98%] w-[12.5%] bg-gray-950 ml-1 rounded-3xl text-white">
      <div className="flex text-xl justify-center items-center w-full h-16 font-extrabold">
        MOSHI
      </div>
      <Link
        to="/"
        className={`${
          pageType === "dashboard" ? "bg-gray-800" : ""
        } py-3 px-12 rounded-2xl`}
        onClick={() => handlePageChange("dashboard")}
      >
        Dashboard
      </Link>
      <Link
        to="/analytics"
        className={`${
          pageType === "analytics" ? "bg-gray-800" : ""
        } py-3 px-12 rounded-2xl`}
        onClick={() => handlePageChange("analytics")}
      >
        Analytics
      </Link>
      <Link
        to="/tracking"
        className={`${
          pageType === "tracking" ? "bg-gray-800" : ""
        } py-3 px-12 rounded-2xl`}
        onClick={() => handlePageChange("tracking")}
      >
        Tracking
      </Link>
    </div>
  );
};
