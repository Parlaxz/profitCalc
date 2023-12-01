import { useFetcher } from "@remix-run/react";

export default function DateButton({ text, startDate, endDate, selected }) {
  const fetcher = useFetcher();
  console.log("fetcher", fetcher.data);

  const handleClick = async () => {
    await fetcher.submit(
      { startDate, endDate },
      {
        method: "POST",
        action: "/api/setDateCookies",
      }
    );
  };

  return (
    <>
      {" "}
      <button
        className={
          selected
            ? "text-white font-semibold text-base bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 p-4 py-2 rounded-full"
            : "text-blue-500 font-semibold text-base border-blue-500 border-2 p-4 py-2 rounded-full"
        }
        onClick={handleClick}
      >
        {text}
      </button>
    </>
  );
}
