import React, { useState, useEffect } from "react";

import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { prisma } from "~/apiHelpers";
import { AtSymbolIcon } from "@heroicons/react/24/solid";

import "react-datepicker/dist/react-datepicker.css";

import ReactDatePicker, { type ReactDatePickerProps } from "react-datepicker";
import { Sidebar } from "./Sidebar";
import {
  BanknotesIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  ForwardIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
// @ts-ignore
const Picker = ReactDatePicker.default;
export const DatePicker = ({
  className,
  onChange,
  onBlur,
  selected,
}: ReactDatePickerProps) => (
  <Picker
    maxDate={new Date()}
    className={className}
    onChange={onChange}
    onBlur={onBlur}
    selected={selected}
  />
);
export async function loader({ request }: LoaderFunctionArgs) {
  const currentDate = new Date();
  const oneHourAgo = new Date(currentDate.getTime() - 60 * 60 * 1000 * 1 * 3); // Subtracting 3 hours  in milliseconds

  // const liveUsers = await prisma.user.findMany({
  //   orderBy: [
  //     {
  //       timeUpdated: "desc",
  //     },
  //   ],
  //   where: {
  //     timeUpdated: {
  //       gte: oneHourAgo.toISOString(), // Using ISOString to match the format in the database
  //     },
  //   },
  // });
  const allUsers = await prisma.user.findMany({});
  const liveUsers = allUsers
    .filter((user) => {
      const timeUpdated = new Date(user.timeUpdated);
      return timeUpdated >= oneHourAgo;
    })
    .sort((a, b) => new Date(b.timeUpdated) - new Date(a.timeUpdated));
  return json({ liveUsers, allUsers });
}

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  let revalidator = useRevalidator();
  useEffect(() => {
    // Define the revalidation function
    const revalidate = () => {
      // Assuming revalidator is available in the scope
      revalidator.revalidate();
    };

    // Set up an interval to call revalidate every 10 seconds
    const intervalId = setInterval(revalidate, 10000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to ensure the effect runs only once on mount

  const loaderData = useLoaderData<typeof loader>();
  const [pageType, setPageType] = useState("tracking");
  const purchasers = loaderData?.allUsers?.filter((user) =>
    user.events.some((event) => event.type === "purchase")
  );
  console.log("purchasers", purchasers);
  const utmData = {};

  loaderData?.allUsers?.forEach((user) => {
    const utmSource = user.UTM?.utmSource;

    if (utmSource) {
      if (!utmData[utmSource]) {
        utmData[utmSource] = {};
      }

      user.events.forEach((event) => {
        const eventType = event.type;

        if (!utmData[utmSource][eventType]) {
          utmData[utmSource][eventType] = { count: 0, value: 0 };
        }

        utmData[utmSource][eventType].count++;
        utmData[utmSource][eventType].value += parseFloat(event.value) ?? 0;
      });
    }
  });

  console.log("utmData", utmData);

  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center overflow-hidden">
      <Sidebar key={"pageType"} pageType={pageType} setPageType={setPageType} />
      <div></div>
      <div className="max-h-screen h-screen md:w-[87.5%] bg-white">
        <div className="flex items-center justify-between font-bold text-2xl p-2 md:p-8 pb-0 ">
          <div>Tracking Page</div>
        </div>
        {/* Main Body */}
        <div className="grid md:gap-8 grid-rows-2 md:grid-rows-1 grid-cols-1 md:grid-cols-5 w-full h-[200vh] md:h-full md:p-8 md:pt-0">
          <div className="md:col-span-2">
            <Card>
              <div className="max-h-full">
                <div>
                  <div className="w-fit h-fit p-2 bg-neutral-100 rounded-full">
                    <VideoCameraIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                    Live View{" "}
                    <span className="text-neutral-300 text-sm">
                      (last 180m)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col overflow-auto pr-4 h-fit max-h-full">
                  {loaderData.liveUsers.map((user, index) => {
                    return <LiveUser user={user} key={"user" + index} />;
                  })}
                </div>
              </div>
            </Card>
          </div>
          <div className="col-span-3">
            <Card>
              <div className="flex flex-col h-max-full overflow-hidden">
                <div>
                  <div className="w-fit h-fit p-2 bg-neutral-100 rounded-full">
                    <AtSymbolIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                    UTM High Stakes Leaderboards
                  </div>
                </div>
                <div>
                  <UTMTable data={utmData} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Card = ({ children = <></>, className = "" }) => {
  return (
    <div
      className={
        "w-full h-full border-neutral-200 border md:text-base text-sm rounded-2xl px-4 md:px-12 py-2 md:py-4 grid grid-flow-row gap-2 shadow-sm  max-h-[89vh] overflow-auto" +
        className
      }
    >
      {children}
    </div>
  );
};

function LiveUser({ user }) {
  const [displayIndex, setDisplayIndex] = useState(null);
  const currentDate = new Date();
  const eventDate = new Date(user?.timeUpdated); // Subtracting 1 hour in milliseconds
  const secondsElapsed = (currentDate.getTime() - eventDate.getTime()) / 1000;
  return (
    <>
      <div
        className={`${
          secondsElapsed > 60 * 10
            ? "border-neutral-200 border"
            : "border-neutral-400 border"
        }  p-4 rounded-md h-fit my-2 block overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <span>{user.ip}</span>
          <span className="text-neutral-500">
            {user?.UTM?.utmSource} / {user?.UTM?.utmMedium}
          </span>
        </div>
        <div className="flex overflow-x-auto pb-2">
          {" "}
          {user.events.map((event, index) => {
            const currentDate = new Date();
            const eventDate = new Date(event?.timeCreated); // Subtracting 1 hour in milliseconds
            const secondsElapsed =
              (currentDate.getTime() - eventDate.getTime()) / 1000;
            let displayedTime = Math.floor(secondsElapsed) + "s";
            if (secondsElapsed > 3600) {
              displayedTime = Math.floor(secondsElapsed / 3600) + "h";
            } else if (secondsElapsed > 60) {
              displayedTime = Math.floor(secondsElapsed / 60) + "m";
            }

            return secondsElapsed > 60 * 60 * 48 ? (
              <></>
            ) : (
              <div
                key={"event" + index}
                className={`flex flex-col px-2 justify-center items-center border-gray-200 border rounded-lg mx-1 ${
                  event?.type === "purchase"
                    ? "bg-green-800 text-white font-semibold"
                    : event?.type === "InitiateCheckout" ||
                      event?.type === "AcceleratedCheckout"
                    ? "bg-yellow-600 text-white font-semibold"
                    : ""
                }  `}
              >
                <span>{event.value}</span>
                <button
                  onClick={() => {
                    setDisplayIndex(
                      Number.isInteger(displayIndex) ? null : index
                    );
                  }}
                >
                  {event?.type === "AddToCart" ? (
                    <ShoppingCartIcon className="h-6 w-6" />
                  ) : event?.type === "InitiateCheckout" ||
                    event?.type === "AcceleratedCheckout" ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : event?.type === "purchase" ? (
                    <BanknotesIcon className="h-6 w-6" />
                  ) : (
                    event?.type
                  )}
                </button>
                <span>{displayedTime}</span>
              </div>
            );
          })}
        </div>
        <div>
          {" "}
          {console.log(
            "user?.events[displayIndex]",
            user?.events[displayIndex]
          )}
          {Number.isInteger(displayIndex) ? (
            <div>{user?.events[displayIndex]?.value}</div>
          ) : (
            ""
          )}
          {Number.isInteger(displayIndex) &&
            (user?.events[displayIndex]?.lines?.map((line) => {
              return event?.type !== "InitiateCheckout"
                ? JSON.stringify(line)
                : "";
            }) ??
              "")}
        </div>
      </div>
    </>
  );
}

const UTMTable = ({ data }) => {
  const [skullEmoji, summonSkullEmoji] = useState(false);
  // Convert the data object to an array and sort it by purchase count
  const sortedData = Object.entries(data)
    .sort(([aKey, a], [bKey, b]) => {
      const aPurchase = a?.purchase ?? { count: 0, value: 0 };
      const bPurchase = b?.purchase ?? { count: 0, value: 0 };

      // if
      // (bPurchase.count !== aPurchase.count) {
      //   return bPurchase.count - aPurchase.count; // Sort by purchase count
      // } else
      // {
      return bPurchase.value - aPurchase.value; // Sort by purchase value if counts are equal
      // }
    })
    .map(([utmSource, events], index) => ({
      utmSource,
      events,
      index: index + 1,
    }));

  // Calculate the number of days since the first event
  // Calculate the number of days since 6 PM on December 11th, 2023
  const targetDate = new Date("2023-12-11T23:00:00");
  const currentDate = new Date();

  const daysSinceTargetDate =
    (currentDate - targetDate) / (1000 * 60 * 60 * 24);

  // Calculate the number of non-linktree utms
  const numAds = sortedData.filter((d) => d.utmSource !== "linktree").length;

  // Budget and linktree purchase value
  const budget = 75;
  const linkTreeValue =
    sortedData.find((d) => d.utmSource === "linktree")?.events?.purchase
      ?.value ?? 0;

  // Calculate breakeven
  const breakeven =
    daysSinceTargetDate * budget * (1 / 0.435) - linkTreeValue / numAds;

  console.log("breakeven", breakeven);
  return (
    <div className="overflow-x-auto text-xs text-center">
      {skullEmoji && (
        <div className="my-4">
          Ain't no way you thought that'd work💀 Wtf you tryna sort
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Number</th>
            <th className="py-2 px-4 border-b">UTM Source</th>
            <th className="py-2 px-4 border-b">Add To Cart Count</th>
            <th className="py-2 px-4 border-b">Add To Cart Value</th>
            <th className="py-2 px-4 border-b">Checkout Count</th>
            <th className="py-2 px-4 border-b">Checkout Value</th>
            <th className="py-2 px-4 border-b">Purchase Count</th>
            <th className="py-2 px-4 border-b">
              <div className="flex items-center">
                <span>Purchase Value</span>{" "}
                <button
                  onClick={() => {
                    summonSkullEmoji((prev) => !prev);
                  }}
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </th>
            <th className="py-2 px-4 border-b">Profit</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(({ utmSource, events, index }) => {
            const isLinktree = utmSource === "linktree";
            return (
              <tr
                key={utmSource}
                className={
                  events?.purchase?.value < breakeven * 0.8 && !isLinktree
                    ? "bg-red-100"
                    : events?.purchase?.value < breakeven && !isLinktree
                    ? "bg-yellow-100"
                    : !isLinktree &&
                      events?.purchase?.value >
                        breakeven + linkTreeValue / numAds
                    ? "bg-blue-200"
                    : !isLinktree
                    ? "bg-green-100"
                    : ""
                }
              >
                {console.log("UTMSRC", utmSource)}
                <td className="py-1 px-4 border-b">{index}</td>
                <td className="py-1 px-4 border-b">{utmSource}</td>
                <td className="py-1 px-4 border-b">
                  {events?.AddToCart?.count ?? 0}
                </td>
                <td className="py-1 px-4 border-b">
                  {events?.AddToCart?.value?.toFixed(2) ?? 0}
                </td>
                <td className="py-1 px-4 border-b">
                  {(events?.InitiateCheckout?.count ?? 0) +
                    (events?.AcceleratedCheckout?.count ?? 0)}
                </td>
                <td className="py-1 px-4 border-b">
                  {(
                    (events?.InitiateCheckout?.value ?? 0) +
                    (events?.AcceleratedCheckout?.value ?? 0)
                  ).toFixed(2)}
                </td>
                <td className="py-1 px-4 border-b">
                  {events?.purchase?.count ?? 0}
                </td>
                <td className="py-1 px-4 border-b">
                  {events?.purchase?.value?.toFixed(2) ?? 0}
                </td>
                <td className="py-1 px-4 border-b">
                  {(events?.purchase?.value - breakeven)?.toFixed(2) ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        Current Breakeven - {breakeven.toFixed(2)} | Number of days -{" "}
        {daysSinceTargetDate.toFixed(2)}
      </div>
      <div className=" text-left mt-1">
        <h3 className="text-lg font-semibold underline">Key</h3>
        <div className="grid gap-1 grid-cols-2 grid-rows-2 grid-flow-col">
          <div className="flex items-center">
            <div className="bg-blue-300 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
            -
            <span className="mr-1">
              Over breakeven w/o help from linktree Ads
            </span>
            <span className="text-neutral-500">
              ({">"}breakeven + linktree)
            </span>
          </div>
          <div className="flex items-center">
            <div className="bg-green-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
            -<span className="mr-1">Over breakeven</span>
            <span className="text-neutral-500">({">"}breakeven)</span>
          </div>
          <div className="flex items-center">
            <div className="bg-yellow-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
            -<span className="mr-1">Close to breakeven</span>
            <span className="text-neutral-500">{"> "}(breakeven * .8)</span>
          </div>
          <div className="flex items-center">
            <div className="bg-red-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
            -<span className="mr-1">Far Below breakeven</span>
            <span className="text-neutral-500">{"< "}(breakeven * .8)</span>
          </div>
        </div>
      </div>
      <div className=" text-left mt-2">
        <h3 className="text-lg font-semibold underline">Notes</h3>
        <div className=" font-semibold">
          - Breakeven = daysSinceFirstRecordedEvent * budget * (1 / 0.435) -
          linkTreeValue / numAds;
        </div>
        <div className=" font-semibold">
          - Profit is generously calculated. It is total revenue - cost +
          linktree/numAds, which means it's an estimate and more generous to the
          lower ads
        </div>
        <div>
          - the daysSinceFirstRecordedEvent is Dec 11th, 2023, the day the UTM
          leaderboard started tracking. It is a float, so after 2 and a half
          days it is 2.5
        </div>
        <div>
          - (budget * (1 / 0.435)) is roughly 175, where .435 is Amr's profit
          margin estimation, meaning 175 is needed a day for an ad to breakeven
        </div>
        <div>
          - linkTreeValue / numAds is simply distributing the linktree revenue
          to all the ads equally. This helps the lower performing ads since
          realistically, they probably get less than their share of the linktree
          sales, giving them more of a chance
        </div>
        <div className=" font-semibold">
          - Assumptions (it breaks when any of this changes) = 1. budget for all
          ads is 75 and 2.start dates of all ads are the same
        </div>
      </div>
    </div>
  );
};
