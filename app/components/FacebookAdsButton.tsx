// components/FacebookAdsButton.js

import { useFetcher } from "@remix-run/react";

export default function FacebookAdsButton() {
  const fetcher = useFetcher();
  console.log("FacebookAdsButton", fetcher.data);
  const handleClick = async () => {
    await fetcher.submit(
      {},
      {
        method: "POST",
        action: "/api/getFacebookAds",
      }
    );
  };

  return <button onClick={handleClick}>Fetch Facebook Ads</button>;
}
