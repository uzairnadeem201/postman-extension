const requests = new Map();
let activeTabId = null;

//function which update the selected tab id

function updateActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
      console.log("new tab id is ", activeTabId);
      requests.clear();
      console.log("requests clear");
      chrome.storage.local.set({ requests: [] });
    }
  });
}

//Changes Tab id when user switches tab or window

chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.windows.onFocusChanged.addListener(updateActiveTab);
updateActiveTab();

//capture response

//listens before request data

function listenBeforeRequest(details) {
  if (details.tabId != activeTabId) return;
  let queryParams = [];
  const urlObj = new URL(details.url);
  queryParams = Array.from(urlObj.searchParams.entries());
  let requestBody = null;
  if (details.requestBody) {
    if (details.requestBody.formData) {
      requestBody = JSON.stringify(details.requestBody.formData);
    } else if (details.requestBody.raw) {
      try {
        const decoder = new TextDecoder("utf-8");
        requestBody = decoder.decode(details.requestBody.raw[0].bytes);
      } catch {
        requestBody = "[binary data]";
      }
    }
  }
  const req = {
    id: details.requestId,
    url: details.url,
    method: details.method,
    type: details.type,
    tabId: details.tabId,
    timestamp: Date.now(),
    queryparams: queryParams,
    body: requestBody,
  };
  addRequest(req);
  console.log("Request captured:", req);
}

async function replayRequest(req) {
  if (!req) {
    console.warn("No request found for replay");
    return null;
  }

  let headers = {};
  if (req.headers) {
    req.headers.forEach((h) => {
      headers[h.name] = h.value;
    });
  }

  const options = {
    method: req.method,
    headers: headers,
  };

  if (req.body && req.method !== "GET" && req.method !== "HEAD") {
    options.body = req.body;
  }

  try {
    const start = Date.now();
    const response = await fetch(req.url, options);
    const text = await response.text();
    const replayed = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      redirected: response.redirected,
      timestamp: Date.now(),
      duration: Date.now() - start,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
    };

    console.log("Replayed response:", replayed);
    return replayed;
  } catch (err) {
    console.error("Replay failed:", err);
    return { error: err.toString(), timestamp: Date.now() };
  }
}

function listenHeaders(details) {
  if (details.tabId != activeTabId) return;
  const req = requests.get(details.requestId);
  if (req) {
    req.headers = details.requestHeaders;
    addRequest(req);
    console.log("Active Headers sent:", details.requestHeaders);
  }
}

function addRequest(req) {
  requests.set(req.id, req);
  chrome.storage.local.set({ requests: Array.from(requests.values()) });
}

function listenOnCompleted(details) {
  if (details.tabId !== activeTabId) return;

  const req = requests.get(details.requestId);
  if (req) {
    req.status = "completed";
    req.statusCode = details.statusCode;
    replayRequest(req).then((resBody) => {
      req.response = resBody;
      addRequest(req);
      console.log(
        "Request completed with replayed response:",
        req.url,
        resBody
      );
    });
  }
}

function listenOnError(details) {
  if (details.tabId !== activeTabId) return;

  const req = requests.get(details.requestId) || {
    id: details.requestId,
    url: details.url,
    method: details.method,
    type: details.type,
    tabId: details.tabId,
    timestamp: Date.now(),
  };

  req.status = "error";
  req.error = details.error;
  addRequest(req);
  console.warn("Request failed:", req.url, "Error:", details.error);
}

//events listeners

chrome.webRequest.onSendHeaders.addListener(
  listenHeaders,
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  listenBeforeRequest,
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestBody"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "GetRequests") {
    chrome.storage.local.get("requests", ({ requests }) => {
      sendResponse({ requests: requests || [] });
    });

    return true;
  }
  if (msg.action === "ReplayRequest") {
    replayRequest(msg.request).then((res) => {
      sendResponse(res);
    });
    return true;
  }
});

chrome.webRequest.onCompleted.addListener(listenOnCompleted, {
  urls: ["<all_urls>"],
  types: ["xmlhttprequest"],
});

chrome.webRequest.onErrorOccurred.addListener(listenOnError, {
  urls: ["<all_urls>"],
  types: ["xmlhttprequest"],
});
