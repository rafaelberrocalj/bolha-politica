import { getProfiles, Profile } from "./profiles-source";

const IG_APP_ID = "936619743392459"; // Default web Instagram App ID
const DB_NAME = "minha-bolha-politica";
const DB_VERSION = 2; // coordinated with profiles-source.ts (profiles-cache store)
const STORE_NAME = "extension-state";
const PROFILES_CACHE_STORE_NAME = "profiles-cache";
const STATE_KEY = "analysis-state";

let profilesCache: Profile[] = [];

type AnalysisStatus = "IDLE" | "RUNNING" | "COMPLETE" | "ERROR";

type AnalysisState = {
  results: Record<string, number>;
  totals: { left: number; right: number };
  status: AnalysisStatus;
  totalProfiles: number;
  isAnalysisPending: boolean;
  lastError: string | null;
  updatedAt: number | null;
};

const defaultAnalysisState = (): AnalysisState => ({
  results: {},
  totals: { left: 0, right: 0 },
  status: "IDLE",
  totalProfiles: profilesCache.length,
  isAnalysisPending: false,
  lastError: null,
  updatedAt: null,
});

let analysisState: AnalysisState = defaultAnalysisState();
let activeAnalysisRunId = 0;

chrome.action.onClicked.addListener(async (tab) => {
  console.log("[Background] Toolbar action clicked.");
  await resetAnalysisState();

  if (isInstagramUrl(tab.url)) {
    await openExtensionInterface(tab.id);
    return;
  }

  console.log(
    "[Background] Current tab is not Instagram. Opening instagram.com first...",
  );
  const instagramTab = await chrome.tabs.create({
    url: "https://www.instagram.com/",
  });

  await waitForTabCompletion(instagramTab.id);
  await openExtensionInterface(instagramTab.id);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`[Background] Received message type: ${message.type}`);
  if (message.type === "START_ANALYSIS") {
    console.log("[Background] Starting analysis requested by popup.");
    void handleStartAnalysis().then(() => {
      sendResponse(getAnalysisState());
    });
    return true;
  }

  if (message.type === "GET_ANALYSIS_STATE") {
    void hydrateState().then(() => {
      sendResponse(getAnalysisState());
    });
    return true;
  }

  if (message.type === "RESET_ANALYSIS") {
    void resetAnalysisState().then(() => {
      sendResponse(getAnalysisState());
    });
    return true;
  }
});

async function handleStartAnalysis() {
  await hydrateState();

  if (analysisState.isAnalysisPending) {
    console.warn(
      "[Background] Analysis is already pending/running. Ignoring redundant request.",
    );
    return;
  }

  console.log("[Background] Proceeding with analysis pipeline...");
  startBackgroundAnalysis();
}

async function startBackgroundAnalysis() {
  const runId = ++activeAnalysisRunId;
  profilesCache = await getProfiles();
  analysisState = {
    ...defaultAnalysisState(),
    status: "RUNNING",
    isAnalysisPending: true,
    updatedAt: Date.now(),
  };
  await persistState();
  await safeSendMessage({
    type: "ANALYSIS_STATE_CHANGED",
    state: getAnalysisState(),
  });

  console.log("[Background] Iterating through configured profiles...");
  let successfulProfiles = 0;
  const failedProfiles: string[] = [];

  for (const profile of profilesCache) {
    if (runId !== activeAnalysisRunId) {
      console.log("[Background] Analysis run was superseded. Aborting early.");
      return;
    }

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

      analysisState.results[profile.username] = mutualFriendsCount;
      analysisState.updatedAt = Date.now();
      successfulProfiles += 1;
      await persistState();

      console.log("[Background] Broadcasting partial progress update...");
      await safeSendMessage({
        type: "ANALYSIS_PROGRESS",
        state: getAnalysisState(),
      });
    } catch (error) {
      console.error(
        `[Background] Failed to process profile ${profile.username}. Error details:`,
        error,
      );
      failedProfiles.push(profile.username);
    }
  }

  analysisState.isAnalysisPending = false;

  if (runId !== activeAnalysisRunId) {
    console.log(
      "[Background] Analysis run was superseded before final aggregation.",
    );
    return;
  }

  console.log("[Background] Aggregating results by political sides...");
  let totalLeft = 0;
  let totalRight = 0;

  for (const profile of profilesCache) {
    if (typeof analysisState.results[profile.username] === "number") {
      if (profile.side === "left")
        totalLeft += analysisState.results[profile.username];
      if (profile.side === "right")
        totalRight += analysisState.results[profile.username];
    }
  }

  analysisState.totals = { left: totalLeft, right: totalRight };
  analysisState.updatedAt = Date.now();

  if (successfulProfiles === 0) {
    analysisState.status = "ERROR";
    analysisState.lastError =
      "Nao foi possivel carregar os perfis do Instagram. Verifique se voce esta logado, se os perfis seguem publicos e tente novamente.";
  } else if (failedProfiles.length > 0) {
    analysisState.status = "COMPLETE";
    analysisState.lastError = `Alguns perfis nao puderam ser analisados: ${failedProfiles.join(", ")}.`;
  } else {
    analysisState.status = "COMPLETE";
    analysisState.lastError = null;
  }

  await persistState();
  console.log(
    `[Background] Aggregation complete. Left wings: ${totalLeft}, Right wings: ${totalRight}.`,
  );

  if (analysisState.status === "ERROR") {
    console.log("[Background] Broadcasting ANALYSIS_ERROR to popup UI.");
    await safeSendMessage({
      type: "ANALYSIS_ERROR",
      state: getAnalysisState(),
    });
    return;
  }

  console.log("[Background] Broadcasting ANALYSIS_FINISHED to popup UI.");
  await safeSendMessage({
    type: "ANALYSIS_FINISHED",
    state: getAnalysisState(),
  });
}

function isInstagramUrl(url?: string) {
  return /^https:\/\/(www\.)?instagram\.com\//.test(url || "");
}

async function openExtensionInterface(tabId?: number) {
  if (!tabId) {
    return;
  }

  await sendMessageToTab(tabId, { type: "OPEN_EXTENSION_OVERLAY" });
}

function waitForTabCompletion(tabId?: number) {
  if (!tabId) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(handleUpdatedTab);
      resolve();
    }, 6000);

    const handleUpdatedTab = (
      updatedTabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
    ) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }

      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(handleUpdatedTab);
      resolve();
    };

    chrome.tabs.onUpdated.addListener(handleUpdatedTab);
  });
}

async function sendMessageToTab(
  tabId: number,
  message: { type: string },
  retries = 10,
) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      return;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(
          "[Background] Failed to reach Instagram overlay script:",
          error,
        );
        return;
      }

      await delay(300);
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function getAnalysisState() {
  return analysisState;
}

async function resetAnalysisState() {
  activeAnalysisRunId += 1;
  analysisState = defaultAnalysisState();
  await persistState();
}

/**
 * Message transmission helper avoiding 'Could not establish connection. Receiving end does not exist.' exceptions.
 */
function safeSendMessage(message: any) {
  return new Promise<void>((resolve) => {
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
        resolve();
      });
    } catch (e) {
      console.error(
        "[Background Helper] Critical error occurred while dispatching message:",
        e,
      );
      resolve();
    }
  });
}

async function hydrateState() {
  try {
    profilesCache = await getProfiles();
    const persistedState = await readPersistedState();
    if (persistedState) {
      analysisState = {
        ...defaultAnalysisState(),
        ...persistedState,
        totalProfiles: profilesCache.length,
      };
    }
  } catch (error) {
    console.error("[Background] Failed to hydrate persisted state:", error);
    analysisState = defaultAnalysisState();
  }
}

async function persistState() {
  try {
    await writePersistedState(analysisState);
  } catch (error) {
    console.error("[Background] Failed to persist analysis state:", error);
  }
}

function openStateDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(PROFILES_CACHE_STORE_NAME)) {
        db.createObjectStore(PROFILES_CACHE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readPersistedState(): Promise<AnalysisState | null> {
  const db = await openStateDatabase();

  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () =>
      resolve((request.result as AnalysisState) || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function writePersistedState(state: AnalysisState) {
  const db = await openStateDatabase();

  return await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(state, STATE_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

void hydrateState();
