const requests = new Map();
let activeTabId = null;

//function which update the selected tab id 

function updateActiveTab(){
    chrome.tabs.query({active:true ,currentWindow:true },(tabs)=>{
        if (tabs.length>0){
            activeTabId = tabs[0].id;
            console.log("new tab id is ",activeTabId);
            requests.clear();
            console.log('requests clear')
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

function listenBeforeRequest(details){
    if (details.tabId != activeTabId) return;
    let queryParams = [];
    const urlObj = new URL(details.url);
    queryParams = Array.from(urlObj.searchParams.entries());
    const req = {
        id: details.requestId,
        url: details.url,
        method: details.method,
        type: details.type,
        tabId: details.tabId,
        timestamp: Date.now(),
        queryparams: queryParams
    }
    addRequest(req);
    console.log("Request captured:", req);
}

function listenHeaders(details){
    if(details.tabId != activeTabId) return;
    const req = requests.get(details.requestId)
    if(req)
    {
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
        addRequest(req);
        console.log("Request completed:", req.url, "Status:", details.statusCode);
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
        timestamp: Date.now()
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
});

chrome.webRequest.onCompleted.addListener(
    listenOnCompleted,
    { urls: ["<all_urls>"], types: ["xmlhttprequest"] }
);

chrome.webRequest.onErrorOccurred.addListener(
    listenOnError,
    { urls: ["<all_urls>"], types: ["xmlhttprequest"] }
);
