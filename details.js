const backbtn = document.getElementById("Backbtn");
const btncontainer = document.getElementById("btncontainer");
let isEdit = false;
let selectedRequest;

function renderResponseBody(body) {
  if (!body) return "No body";
  if (typeof body === "object") {
    return `<pre class="json-body">${formatJSON(body)}</pre>`;
  } else if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return `<pre class="json-body">${formatJSON(parsed)}</pre>`;
    } catch (e) {
      return `<pre class="text-body">${body}</pre>`;
    }
  }
  return `<pre>${body}</pre>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const detailsDiv = document.querySelector(".details");

  chrome.storage.local.get(
    "selectedRequest",
    ({ selectedRequest: storedReq }) => {
      selectedRequest = storedReq;
      if (!selectedRequest) {
        detailsDiv.innerHTML = `<p>No request selected.</p>`;
        return;
      }

      function formatJSON(obj) {
        try {
          return JSON.stringify(obj, null, 2);
        } catch (e) {
          return obj.toString();
        }
      }

      function render() {
        detailsDiv.innerHTML = `
            <div class="request-section">
                <h3>Request Information</h3>
                <div class="request-container">
                <div class="request-url">
                    <div style="margin-top:8px">
                    <strong>${selectedRequest.method}</strong>
                    </div>
                    <div class="url-text" contenteditable>${selectedRequest.url}</div>
                    <button class="Sendbtn" id="sendbtn">Send</button>
                </div>
                </div>
                <div class="btns-container">
                <button class="btn" id="Params">Params</button>
                <button class="btn" id="Headers">Headers</button>
                <button class="btn" id="Authorization">Authorization</button>
                <button class="btn" id="Body">Body</button>
                </div>
                <div class="table-container" id="table"></div>
                <div class="response-header">
                <div class="btns-container">
                    <button class="btn" id="resBody">Body</button>
                    <button class="btn" id="resHeaders">Headers</button>
                </div>
                ${
                    selectedRequest.response
                    ? `
                        <div class="response-status response-status-${
                        selectedRequest.response.ok ? "success" : "error"
                        }">
                        ${selectedRequest.response.status} ${selectedRequest.response.statusText}
                        </div>
                    `
                    : ""
                }
                </div>
                <div class="table-container" id="restable"></div>
            </div>
        `;

        document
          .getElementById("resBody")
          .addEventListener("click", () => handleResClick("resBody"));
        document
          .getElementById("resHeaders")
          .addEventListener("click", () => handleResClick("resHeaders"));
        document
          .getElementById("Params")
          .addEventListener("click", () => handleClick("Params"));
        document
          .getElementById("Headers")
          .addEventListener("click", () => handleClick("Headers"));
        document
          .getElementById("Authorization")
          .addEventListener("click", () => handleClick("Authorization"));
        document
          .getElementById("Body")
          .addEventListener("click", () => handleClick("Body"));
        document
          .getElementById("backbtn")
          .addEventListener("click", goBackToMainPage);
        const editBtn = document.getElementById("editbtn");
        if (editBtn) {
          editBtn.addEventListener("click", makeFormEditable);
        }
        const sendBtn = document.getElementById("sendbtn");
        if (sendBtn) {
          sendBtn.addEventListener("click", sendRequest);
        }
      }
      render();
      function goBackToMainPage() {
        window.location.href = "popup.html";
      }
      function makeFormEditable() {
        isEdit = true;
        render();
      }
      function sendRequest() {
        const url = document.querySelector(".url-text").innerText.trim();
        const headers = [];
        document.querySelectorAll(".headers-list li").forEach((li) => {
          const parts = li.innerText.split(":");
          if (parts.length >= 2) {
            headers.push({
              name: parts[0].trim(),
              value: parts.slice(1).join(":").trim(),
            });
          }
        });
        const queryParams = [];
        document.querySelectorAll(".params-list li").forEach((li) => {
          const parts = li.innerText.split(":");
          if (parts.length >= 2) {
            queryParams.push([
              parts[0].trim(),
              parts.slice(1).join(":").trim(),
            ]);
          }
        });
        const body = document.querySelector(".body-container").innerText.trim();
        const editedReq = {
          url,
          method: selectedRequest.method,
          type: selectedRequest.type,
          headers,
          queryParams,
          body,
          timestamp: Date.now(),
        };
        chrome.runtime.sendMessage(
          { action: "ReplayRequest", request: editedReq },
          (response) => {
            selectedRequest.response = response;
            selectedRequest.status = response.ok ? "completed" : "error";
            selectedRequest.statusCode = response.status;
            selectedRequest = {
              ...editedReq,
              response,
              status: response.ok ? "completed" : "error",
              statusCode: response.status || "-",
            };
            chrome.storage.local.set({ selectedRequest });
            isEdit = false;
            render();
          }
        );
      }
    }
  );
});

function handleClick(tabId) {
  const table = document.getElementById("table");

  switch (tabId) {
    case "Headers":
      table.innerHTML = `
        <table border="1" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      `;

      const tbody = document.getElementById("tbody");

      if (selectedRequest.headers && selectedRequest.headers.length > 0) {
        tbody.innerHTML = selectedRequest.headers
          .map(
            (h) => `
              <tr>
                <td contenteditable="true">${h.name}</td>
                <td contenteditable="true">${h.value}</td>
                <td contenteditable="true"></td>
              </tr>
            `
          )
          .join("");
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align:center;">No Headers</td>
          </tr>
        `;
      }
      break;
    case "Body":
      table.innerHTML = `
        <table border="1" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th>Body</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      `;

      const bodyTbody = document.getElementById("tbody");

      if (selectedRequest.body) {
        bodyTbody.innerHTML = `
          <tr>
            <td contenteditable="true">${
              typeof selectedRequest.body === "object"
                ? JSON.stringify(selectedRequest.body, null, 2)
                : selectedRequest.body
            }</td>
          </tr>
        `;
      } else {
        bodyTbody.innerHTML = `
          <tr>
            <td style="text-align:center;">No Body</td>
          </tr>
        `;
      }
      break;
  }
}
function handleResClick(tabId) {
  const table = document.getElementById("restable");

  switch (tabId) {
    case "resHeaders":
      table.innerHTML = `
        <table border="1" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody id="restbody"></tbody>
        </table>
      `;

      const tbody = document.getElementById("restbody");

      if (
        selectedRequest.response &&
        selectedRequest.response.headers &&
        Object.keys(selectedRequest.response.headers).length > 0
      ) {
        tbody.innerHTML = Object.entries(selectedRequest.response.headers)
          .map(
            ([key, value]) => `
              <tr>
                <td contenteditable="true">${key}</td>
                <td contenteditable="true">${value}</td>
              </tr>
            `
          )
          .join("");
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="2" style="text-align:center;">No Headers</td>
          </tr>
        `;
      }
      break;
    case "resBody":
      table.innerHTML = `
    <div class="detail-item">
      <strong>Response Body:</strong>
      <div class="body-container">
        ${
          selectedRequest.response && selectedRequest.response.body
            ? renderResponseBody(selectedRequest.response.body)
            : `<p style="text-align:center;">No Body</p>`
        }
      </div>
    </div>
    ${
      selectedRequest.response && selectedRequest.response.error
        ? `<div class="detail-item error">
             <strong>Response Error:</strong> ${selectedRequest.response.error}
           </div>`
        : ""
    }
  `;
      break;
  }
}
backbtn.addEventListener("click", goBackToMainPage);
