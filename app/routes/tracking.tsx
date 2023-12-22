import React, { useState, useEffect, useMemo } from "react";

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
import TableCell from "./TableCell";
import type { User } from "~/data/typeDefinitions";

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
  let allUsers = await prisma.user.findMany({ include: { events: true } });
  allUsers = allUsers.map((user) => {
    return { ...user, events: [...user.events, ...user.eventsOld] };
  });
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

  const loaderData = useLoaderData<typeof loader>();
  console.log("loaderData", loaderData);
  const [pageType, setPageType] = useState("tracking");
  const purchasers = loaderData?.allUsers?.filter((user) =>
    user.events.some((event) => event.type === "purchase")
  );
  console.log("purchasers", purchasers);
  const utmData = {};
  const [filter, setFilter] = useState("all");

  // Add these functions to handle button clicks
  const handleTodayClick = () => {
    setFilter("today");
  };

  const handleYesterdayClick = () => {
    setFilter("yesterday");
  };

  const handleAllTimeClick = () => {
    setFilter("all");
  };

  // Filter the data based on the selected filter
  console.log("loaderData?.allUsers", loaderData?.allUsers);

  // ...

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );

    if (filter === "today") {
      return loaderData?.allUsers?.map((user: User) =>
        new Date(user.timeCreated) >= today
          ? user
          : {
              events: [],
              UTM: {
                utmSource: user.UTM?.utmSource,
                utmMedium: user.UTM?.utmMedium,
              },
            }
      );
    } else if (filter === "yesterday") {
      return loaderData?.allUsers?.filter(
        (user: User) =>
          new Date(user.timeCreated) >= yesterday &&
          new Date(user.timeCreated) < today
      );
    } else {
      return loaderData?.allUsers;
    }
  }, [filter, loaderData]);

  // Iterate over each user in the filteredData array
  filteredData?.forEach((user) => {
    // Get the UTM source from the user object, default to "No Source" if it doesn't exist
    const utmSource = user.UTM?.utmSource || "No Source";

    // If there's no entry for this UTM source in utmData, initialize one
    if (!utmData[utmSource]) {
      utmData[utmSource] = {};
    }

    // Iterate over each event in the user's events array
    user.events.forEach((event) => {
      // Get the event type from the event object
      const eventType = event.type;

      // If there's no entry for this event type under the current UTM source in utmData, initialize one
      if (!utmData[utmSource][eventType]) {
        utmData[utmSource][eventType] = { count: 0, value: 0 };
      }

      // Increment the count for this event type under the current UTM source in utmData
      utmData[utmSource][eventType].count++;

      // Add the value of the current event (converted to a float) to the value for this event type under the current UTM source in utmData
      // If the value of the current event is not a number, default to 0
      utmData[utmSource][eventType].value += parseFloat(event.value) ?? 0;
    });
  });

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
  // Add this at the top of your component

  console.log("utmData", utmData);

  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center overflow-hidden dark:bg-gray-950 dark:text-neutral-200">
      <Sidebar key={"pageType"} pageType={pageType} setPageType={setPageType} />
      <div></div>
      <div className="max-h-screen h-screen md:w-[87.5%] bg-white dark:bg-gray-950 dark:text-neutral-200">
        <div className="flex items-center justify-between font-bold text-2xl p-2 md:p-8 pb-0 ">
          <div>Tracking Page</div>
        </div>
        {/* Main Body */}
        <div className="grid md:gap-8 grid-rows-2 md:grid-rows-1 grid-cols-1 md:grid-cols-5 w-full h-[200vh] md:h-full md:p-8 md:pt-0">
          <div className="md:col-span-2">
            <Card>
              <div className="max-h-full">
                <div>
                  <div className="w-fit h-fit p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                    <VideoCameraIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4 dark:text-neutral-200">
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
                  <div className="w-fit h-fit p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                    <AtSymbolIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4 flex justify-between items-center">
                    <span className="dark:text-neutral-200">
                      UTM High Stakes Leaderboards
                    </span>
                    <div className="text-base font-bold">
                      <button
                        className={`p-2 mx-1 border border-neutral-400 dark:text-neutral-200 rounded-lg ${
                          filter === "today" ? "bg-gray-500 text-white" : ""
                        }`}
                        onClick={handleTodayClick}
                      >
                        Today
                      </button>
                      <button
                        className={`p-2 mx-1 border dark:text-neutral-200 border-neutral-400 rounded-lg ${
                          filter === "yesterday" ? "bg-gray-500 text-white" : ""
                        }`}
                        onClick={handleYesterdayClick}
                      >
                        Yesterday
                      </button>
                      <button
                        className={`p-2 mx-1 border dark:text-neutral-200 border-neutral-400 rounded-lg ${
                          filter === "all" ? "bg-gray-500 text-white" : ""
                        }`}
                        onClick={handleAllTimeClick}
                      >
                        All Time
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <UTMTable data={utmData} dateRange={filter} />
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
        "w-full h-full border-neutral-200 dark:border-neutral-700 border md:text-base text-sm rounded-2xl px-4 md:px-12 py-2 md:py-4 grid grid-flow-row gap-2 shadow-sm  max-h-[89vh] overflow-auto" +
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
            ? "border-neutral-200 border dark:border-neutral-700"
            : "border-neutral-400 border dark:border-neutral-500"
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
          {Number.isInteger(displayIndex) ? (
            <div>{user?.events[displayIndex]?.cartId}</div>
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

const UTMTable = ({ data, dateRange }) => {
  const [skullEmoji, summonSkullEmoji] = useState(false);
  const [utmInfoView, setUtmInfoView] = useState<String>("key");

  // Convert the data object to an array and sort it by purchase count
  const sortedData = Object.entries(data)
    .sort(([aKey, a], [bKey, b]) => {
      if (aKey === "linktree" || aKey === "No Source") return 1;
      if (bKey === "linktree" || bKey === "No Source") return -1;

      const aPurchase: { count: number; value: number } = a?.purchase ?? {
        count: 0,
        value: 0,
      };
      const bPurchase: { count: number; value: number } = b?.purchase ?? {
        count: 0,
        value: 0,
      };

      return bPurchase.value - aPurchase.value; // Sort by purchase value if counts are equal
    })
    .map(([utmSource, events], index) => ({
      utmSource,
      events,
      index: index + 1,
    }));

  // Calculate the number of days since the first event
  // Calculate the number of days since 6 PM on December 11th, 2023
  const targetDate: Date = new Date("2023-12-11T23:59:00");
  const currentDate: Date = new Date();

  let daysSinceTargetDate: number =
    (currentDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
  if (dateRange === "today") {
    daysSinceTargetDate = daysSinceTargetDate - Math.floor(daysSinceTargetDate);
  } else if (dateRange === "yesterday") {
    daysSinceTargetDate = 1;
  }

  // Calculate the number of non-linktree or No Source utms
  const numAds: number = sortedData.filter(
    (d) => d.utmSource !== "linktree" && d.utmSource !== "No Source"
  ).length;

  // Budget and linktree purchase value
  const budget: number = 75; //TODO: make this dynamic
  const linkTreeValue: number =
    sortedData.find((d) => d.utmSource === "linktree")?.events?.purchase
      ?.value ?? 0;
  const noSourceValue: number =
    sortedData.find((d) => d.utmSource === "No Source")?.events?.purchase
      ?.value ?? 0;
  const nonPaidValue: number = linkTreeValue + noSourceValue;

  return (
    <div className="overflow-x-auto text-xs text-center ">
      {skullEmoji && (
        <div className="my-4">
          Ain't no way you thought that'd work💀 Wtf you tryna sort
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300 dark:text-neutral-950">
        <thead>
          <tr>
            {/* <th className="py-2 px-4 border-b">Number</th> */}
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
            <th className="py-2 px-4 border-b">Profit LinkTree</th>
            <th className="py-2 px-4 border-b">Profit All</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(({ utmSource, events, index }) => {
            const isAd = !(
              utmSource === "linktree" || utmSource === "No Source"
            );
            let profit =
              events?.purchase?.value * 0.435 - budget * daysSinceTargetDate
                ? events?.purchase?.value * 0.435 - budget * daysSinceTargetDate
                : 0 - budget * daysSinceTargetDate;
            let profitAll = profit + (nonPaidValue * 0.435) / numAds;
            let profitLinktree = profit + (linkTreeValue * 0.435) / numAds;
            if (profitLinktree < 0) profitLinktree = 0;
            if (profitAll < 0) profitAll = 0;
            if (profit < 0) profit = 0;
            // if (!isAd) {
            //   profit = 0;
            // }
            return (
              <tr
                key={utmSource}
                className={
                  isAd && profit > 0
                    ? "bg-blue-200"
                    : isAd && profitLinktree > 0
                    ? "bg-green-100"
                    : isAd && profitAll > 0
                    ? // Math.abs(profit) < 0.8 * budget * daysSinceTargetDate
                      "bg-yellow-100"
                    : isAd
                    ? "bg-red-100"
                    : ""
                }
              >
                {/* <td className="py-1 px-4 border-b">{index}</td> */}
                <td className="py-1 px-4 border-b">{utmSource}</td>
                <TableCell value={events?.AddToCart?.count} fixed={0} />
                <TableCell value={events?.AddToCart?.value} />
                <TableCell
                  value={
                    (events?.InitiateCheckout?.count ?? 0) +
                    (events?.AcceleratedCheckout?.count ?? 0)
                  }
                  fixed={0}
                />
                <TableCell
                  value={
                    (events?.InitiateCheckout?.value ?? 0) +
                    (events?.AcceleratedCheckout?.value ?? 0)
                  }
                />
                <TableCell value={events?.purchase?.count} fixed={0} />
                <TableCell value={events?.purchase?.value} />
                <TableCell value={profit} />
                <TableCell value={isAd ? profitLinktree : 0} />
                <TableCell value={isAd ? profitAll : 0} />
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        {/* Current Breakeven - {breakeven.toFixed(2)} | Number of days -{" "} */}
        {daysSinceTargetDate.toFixed(2)}
      </div>
      <div className="text-left flex">
        <button
          onClick={() => {
            setUtmInfoView("key");
          }}
          className={`p-2 mr-2 rounded-md border border-neutral-400 ${
            utmInfoView === "key" ? "bg-gray-500 text-white" : ""
          }`}
        >
          Key
        </button>
        <button
          onClick={() => {
            setUtmInfoView("notes");
          }}
          className={`p-2 rounded-md border border-neutral-400 ${
            utmInfoView === "notes" ? "bg-gray-500 text-white" : ""
          }`}
        >
          Notes
        </button>
      </div>
      {utmInfoView === "key" ? <UTMKey /> : <UTMNotes />}
    </div>
  );
};

function UTMKey() {
  return (
    <div className=" text-left mt-1">
      <div className="grid gap-1 grid-cols-2 grid-rows-2 grid-flow-col">
        <div className="flex items-center">
          <div className="bg-blue-300 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
          -
          <span className="mr-1">
            Gigachad Over breakeven w/o help from linktree Ads
          </span>
          <span className="text-neutral-500">({">"}breakeven + linktree)</span>
        </div>
        <div className="flex items-center">
          <div className="bg-green-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
          -<span className="mr-1">Breakeven with linktree</span>
          {/* <span className="text-neutral-500">({">"}breakeven)</span> */}
        </div>
        <div className="flex items-center">
          <div className="bg-yellow-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
          -<span className="mr-1">Breakeven with profit All</span>
          {/* <span className="text-neutral-500">{"> "}(within 20% of it)</span> */}
        </div>
        <div className="flex items-center">
          <div className="bg-red-200 rounded-md w-4 h-4 p-3 border-neutral-400 border mr-2"></div>
          -<span className="mr-1">Are you even trying?</span>
          {/* <span className="text-neutral-500">{"< "}(breakeven * .8)</span> */}
        </div>
      </div>
    </div>
  );
}

function UTMNotes() {
  return (
    <div className=" text-left mt-2">
      <div className=" font-semibold">
        I need to update these notes they're mostly wrong with the latest
        balance patchs
      </div>
      <div className=" font-semibold">
        - Profit is generously calculated. It is total revenue - cost +
        linktree/numAds, which means it's an estimate and more generous to the
        lower ads
      </div>
      <div>
        - the daysSinceFirstRecordedEvent is Dec 11th, 2023, the day the UTM
        leaderboard started tracking. It is a float, so after 2 and a half days
        it is 2.5
      </div>
      <div>
        - (budget * (1 / 0.435)) is roughly 175, where .435 is Amr's profit
        margin estimation, meaning 175 is needed a day for an ad to breakeven
      </div>
      <div>
        - linkTreeValue / numAds is simply distributing the linktree revenue to
        all the ads equally. This helps the lower performing ads since
        realistically, they probably get less than their share of the linktree
        sales, giving them more of a chance
      </div>
      <div className=" font-semibold">
        - Assumptions (it breaks when any of this changes) = 1. budget for all
        ads is 75 and 2.start dates of all ads are the same
      </div>
    </div>
  );
}
