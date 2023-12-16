// DateButton.tsx
import { useFetcher } from "@remix-run/react";

export default function DateButton({ text, datePreset, selected }) {
  const fetcher = useFetcher();

  const handleClick = async () => {
    await fetcher.submit(
      { datePreset },
      {
        method: "POST",
        action: "/api/setDateCookies",
      }
    );
  };

  return (
    <button
      className={
        selected
          ? "text-white font-semibold  bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 dark:border-blue-700 p-4 py-2 rounded-full text-xs md:text-base"
          : "text-blue-500 font-semibold border-blue-500 border-2 p-4 py-2 rounded-full text-xs md:text-base"
      }
      onClick={handleClick}
    >
      {text}
    </button>
  );
}
