// routes/api/getFacebookAds.js

import { json } from "@remix-run/node";

export async function action({ request }) {
  const campaignId = "120201248481810630"; // Replace with your ad set ID
  const adAccountId = "act_476856863674743";
  const accessToken =
    "EAAKS4ZCAJQzEBOxkNSrH4dgNHMbmjPiitOGvZAam32xzc4lAZBuTxwTwR4mrekcovztqzVQQYamSryYGMpJFdpZCfMoRPbxroGF6CPkTscLcvcfJJiWZBU5BFOYdx4UdZC9GH4ezZAQcZCDdvsZBmxYSqNn6gzEGyeLmdoMjYoYKVjceWVZB2dUoGx50XZANaftZBAreGH7drnEf"; // Replace with your access token

  try {
    const data = await getFacebookAds(adAccountId, accessToken);

    return json(data);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch Facebook Ads data" }, 500);
  }
}
export async function getFacebookAds(
  campaignId,
  accessToken,
  startDate: string,
  endDate: string
) {
  const fields =
    "adset_name,adset_id,impressions,clicks,cost_per_inline_link_click,conversions,cpm,reach,inline_link_click_ctr,spend,inline_link_clicks";
  const apiUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=${fields}&level=adset&time_range={'since':'${startDate}','until':'${endDate}'}`;
  console.log(apiUrl);
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(response.status);
      throw new Error("Failed to fetch Facebook Ads data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export async function getAdBudget(adsetId, accessToken) {
  const apiUrl = `https://graph.facebook.com/v18.0/${adsetId}?fields=daily_budget`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Facebook Ads data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
