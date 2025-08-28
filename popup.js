const tbody = document.getElementById("requestsBody");
const refreshBtn = document.getElementById("refresh");
const tbl = document.getElementById("table");
const clearbtn = document.getElementById("clearbtn");

function renderRequests() {
  chrome.runtime.sendMessage({ action: "GetRequests" }, (response) => {
    const requests = response.requests || [];
    tbody.innerHTML = "";
    if (requests.length === 0) {
      tbody.innerHTML = `
        <div class="empty-state">
            No requests fetched yet
        </div>
      `;
      return;
    }
    requests.forEach((req) => {
      const tr = document.createElement("div");
      tr.className = "tablerow";
      const time = new Date(req.timestamp).toLocaleTimeString();

      tr.innerHTML = `
        <span>${req.method}</span>
        <span class="url-cell" title="${req.url}">${req.url}</span>
        <span>${req.type}</span>
        <span>${time}</span>
      `;

      tbody.appendChild(tr);
    });
  });
}

function clearRequests() {
  chrome.storage.local.set({ requests: [] }, () => {
    tbody.innerHTML = `
      <div class="empty-state">
        No requests fetched yet
      </div>
    `;
    console.log("Requests cleared.");
  });
}

renderRequests();
refreshBtn.addEventListener("click", renderRequests);
clearbtn.addEventListener("click",clearRequests);
