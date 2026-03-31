import { PROFILES } from "./config";

const IG_APP_ID = "936619743392459"; // Default web Instagram App ID

let analysisResults: Record<string, number> = {};
let isAnalysisPending = false;

// Popup opening control and redirect logic
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log(
      "[Background] Extension icon clicked. Checking current tab URL...",
      tab.url,
    );
    if (!tab.url?.includes("instagram.com")) {
      console.log(
        "[Background] Tab is not Instagram. Redirecting or opening new tab...",
      );
      const targetUrl = "https://www.instagram.com/";
      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("edge://") ||
        !tab.url
      ) {
        console.log(
          "[Background] Internal browser page detected. Creating new standard tab...",
        );
        await chrome.tabs.create({ url: targetUrl });
      } else {
        console.log(
          "[Background] Standard page detected. Updating current tab URL...",
        );
        await chrome.tabs.update(tab.id!, { url: targetUrl });
      }

      console.log(
        "[Background] Waiting 800ms for Instagram to begin loading...",
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    console.log("[Background] Preparing to open popup dynamically...");
    await chrome.action.setPopup({ popup: "popup.html" });
    if ((chrome.action as any).openPopup) {
      await (chrome.action as any).openPopup();
      console.log("[Background] Popup opened successfully via openPopup API.");
    } else {
      console.warn(
        "[Background] openPopup API is not supported on this browser version.",
      );
    }
  } catch (err) {
    console.error(
      "[Background] Unhandled error while handling extension click:",
      err,
    );
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`[Background] Received message type: ${message.type}`);
  if (message.type === "START_ANALYSIS") {
    console.log("[Background] Starting analysis requested by popup.");
    handleStartAnalysis();
    return true; // Keep the message channel open for async response
  }
});

async function handleStartAnalysis() {
  if (isAnalysisPending) {
    console.warn(
      "[Background] Analysis is already pending/running. Ignoring redundant request.",
    );
    return;
  }

  console.log("[Background] Proceeding with analysis pipeline...");
  startBackgroundAnalysis();
}

async function startBackgroundAnalysis() {
  isAnalysisPending = true;
  analysisResults = {};

  console.log("[Background] Iterating through configured profiles...");
  for (const profile of PROFILES) {
    try {
      console.log(
        `[Background] Fetching data for user: ${profile.username}...`,
      );
      const payload = await fetchProfileData(profile.username);

      let mutualFriendsCount = 0;
      if (payload?.data?.user?.edge_mutual_followed_by) {
        mutualFriendsCount = payload.data.user.edge_mutual_followed_by.count;
        console.log(
          `[Background] Extracted count using 'edge_mutual_followed_by': ${mutualFriendsCount}`,
        );
      } else if (payload?.data?.user?.edge_mutual_followed_by_count) {
        mutualFriendsCount = payload.data.user.edge_mutual_followed_by_count;
        console.log(
          `[Background] Extracted count using 'edge_mutual_followed_by_count': ${mutualFriendsCount}`,
        );
      } else {
        console.warn(
          `[Background] Missing mutual followed by field in payload for ${profile.username}. Structure might have changed. Payload:`,
          payload,
        );
      }

      analysisResults[profile.username] = mutualFriendsCount;

      console.log(
        "[Background] Storing partial results into session storage...",
      );
      chrome.storage.session.set({ results: analysisResults });

      // Wait a random jittered time (e.g. 1800ms - 3200ms) to emulate organic load
      const jitterMs = Math.floor(Math.random() * (3200 - 1800 + 1)) + 1800;
      console.log(
        `[Background] Anti-bot jitter active. Delaying for ${jitterMs}ms before next scrape (HTTP 429 evasion)...`,
      );
      await new Promise((resolve) => setTimeout(resolve, jitterMs));
    } catch (error) {
      console.error(
        `[Background] Failed to process profile ${profile.username}. Error details:`,
        error,
      );
    }
  }

  isAnalysisPending = false;

  console.log("[Background] Aggregating results by political sides...");
  let totalLeft = 0;
  let totalRight = 0;

  for (const profile of PROFILES) {
    if (typeof analysisResults[profile.username] === "number") {
      if (profile.side === "left")
        totalLeft += analysisResults[profile.username];
      if (profile.side === "right")
        totalRight += analysisResults[profile.username];
    }
  }

  const aggregatedTotals = { left: totalLeft, right: totalRight };
  console.log(
    `[Background] Aggregation complete. Left wings: ${totalLeft}, Right wings: ${totalRight}.`,
  );

  console.log("[Background] Finalizing session storage state to 'COMPLETE'...");
  chrome.storage.session.set({
    results: analysisResults,
    totals: aggregatedTotals,
    lastUpdate: Date.now(),
    status: "COMPLETE",
  });

  console.log("[Background] Broadcasting ANALYSIS_FINISHED to popup UI.");
  safeSendMessage({
    type: "ANALYSIS_FINISHED",
    results: analysisResults,
    totals: aggregatedTotals,
    totalProfiles: PROFILES.length,
  });
}

async function fetchProfileData(username: string) {
  const endpointUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  console.log(`[Background Fetch] Requesting URL: ${endpointUrl}`);

  const response = await fetch(endpointUrl, {
    method: "GET",
    headers: {
      "X-IG-App-ID": IG_APP_ID,
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  console.log(
    `[Background Fetch] HTTP Response Status: ${response.status} ${response.statusText}`,
  );

  if (!response.ok) {
    throw new Error(
      `[Background Fetch] HTTP ${response.status} - Failed to fetch profile details. Instagram might have blocked the request. Header issues or CORS proxy error?`,
    );
  }

  return await response.json();
}

/**
 * Message transmission helper avoiding 'Could not establish connection. Receiving end does not exist.' exceptions.
 */
function safeSendMessage(message: any) {
  try {
    console.log(
      `[Background Helper] Attempting to send safe message: ${message.type}`,
    );
    chrome.runtime.sendMessage(message, () => {
      if (chrome.runtime.lastError) {
        console.info(
          `[Background Helper] Expected info: Runtime message target closed or not listening (Popup likely closed). Discarding broadcast for type ${message.type}.`,
        );
      } else {
        console.log(
          `[Background Helper] Message ${message.type} successfully received by active UI components.`,
        );
      }
    });
  } catch (e) {
    console.error(
      "[Background Helper] Critical error occurred while dispatching message:",
      e,
    );
  }
}
