const backbtn = document.getElementById("backbtn");
const editRequest = document.getElementById("editbtn");
const btncontainer = document.getElementById("btncontainer");
let isEdit = false;

document.addEventListener("DOMContentLoaded", () => {
  const detailsDiv = document.querySelector(".details");

  // Load the selected request from storage
  chrome.storage.local.get("selectedRequest", ({ selectedRequest }) => {
    if (!selectedRequest) {
      detailsDiv.innerHTML = `<p>No request selected.</p>`;
      return;
    }

    // Helper function to format JSON
    function formatJSON(obj) {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return obj.toString();
      }
    }

    // Helper function to render response body
    function renderResponseBody(body) {
      if (!body) return "No body";

      if (typeof body === "object") {
        return `<pre class="json-body">${formatJSON(body)}</pre>`;
      } else if (typeof body === "string") {
        // Try to parse as JSON for better formatting
        try {
          const parsed = JSON.parse(body);
          return `<pre class="json-body">${formatJSON(parsed)}</pre>`;
        } catch (e) {
          // If not JSON, display as plain text
          return `<pre class="text-body">${body}</pre>`;
        }
      }
      return `<pre>${body}</pre>`;
    }

    // Helper function to render request body
    function renderRequestBody(requestBody) {
      if (!requestBody) return "No body";

      if (Array.isArray(requestBody)) {
        return `<pre>${requestBody.join("\n")}</pre>`;
      } else if (typeof requestBody === "object") {
        if (requestBody.formData) {
          return (
            `<ul>` +
            Object.entries(requestBody.formData)
              .map(
                ([key, values]) =>
                  `<li><strong>${key}:</strong> ${
                    Array.isArray(values) ? values.join(", ") : values
                  }</li>`
              )
              .join("") +
            `</ul>`
          );
        } else {
          return `<pre class="json-body">${formatJSON(requestBody)}</pre>`;
        }
      }
      return `<pre>${requestBody}</pre>`;
    }

    function render() {
      btncontainer.innerHTML = `
  <button class="btn" id="backbtn">Back</button>
  ${
    isEdit
      ? `<button class="btn" id="sendbtn">Send Request</button>`
      : `<button class="btn" id="editbtn">Edit Request</button>`
  }
`;

      detailsDiv.innerHTML = `
      <div class="request-section">
        <h3>Request Information</h3>
        <div class="detail-item"><strong>Method:</strong> ${
          selectedRequest.method
        }</div>
        <div class="detail-item"><strong>URL:</strong> <span class="url-text" ${
          isEdit ? 'contenteditable="true"' : ""
        }>${selectedRequest.url}</span></div>
        <div class="detail-item"><strong>Type:</strong> ${
          selectedRequest.type
        }</div>
        <div class="detail-item"><strong>Time:</strong> ${new Date(
          selectedRequest.timestamp
        ).toLocaleString()}</div>
        <div class="detail-item"><strong>Status:</strong> <span class="status-${
          selectedRequest.status
        }">${selectedRequest.status || "pending"}</span></div>
        <div class="detail-item"><strong>Status Code:</strong> ${
          selectedRequest.statusCode || "-"
        }</div>
        ${
          selectedRequest.error
            ? `<div class="detail-item error"><strong>Error:</strong> ${selectedRequest.error}</div>`
            : ""
        }
        
        <div class="detail-item">
          <strong>Query Params:</strong> 
          ${
            selectedRequest.queryParams &&
            selectedRequest.queryParams.length > 0
              ? `<ul class="params-list" ${
                  isEdit ? 'contenteditable="true"' : ""
                }` +
                selectedRequest.queryParams
                  .map((q) => `<li><strong>${q[0]}:</strong> ${q[1]}</li>`)
                  .join("") +
                `</ul>`
              : `<ul class="headers-list" ${
                  isEdit ? 'contenteditable="true"' : ""
                }><li>None</li></ul>`
          }
        </div>

        <div class="detail-item">
          <strong>Request Headers:</strong>
          ${
            selectedRequest.headers && selectedRequest.headers.length > 0
              ? `<ul class="headers-list" ${
                  isEdit ? 'contenteditable="true"' : ""
                }` +
                selectedRequest.headers
                  .map((h) => `<li><strong>${h.name}:</strong> ${h.value}</li>`)
                  .join("") +
                `</ul>`
              : `<ul class="headers-list" ${
                  isEdit ? 'contenteditable="true"' : ""
                }><li>None</li></ul>`
          }
        </div>

        <div class="detail-item">
          <strong>Request Body:</strong>
          <div class="body-container" ${
            isEdit ? 'contenteditable="true"' : ""
          }>${renderRequestBody(selectedRequest.body)}</div>
        </div>
      </div>

      <div class="response-section">
        <h3>Response Information</h3>
        ${
          selectedRequest.response
            ? `
          <div class="detail-item"><strong>Response Status:</strong> <span class="response-status-${
            selectedRequest.response.ok ? "success" : "error"
          }">${selectedRequest.response.status} ${
                selectedRequest.response.statusText
              }</span></div>
          <div class="detail-item"><strong>Response URL:</strong> <span class="url-text">${
            selectedRequest.response.url
          }</span></div>
          <div class="detail-item"><strong>OK:</strong> ${
            selectedRequest.response.ok ? "OK" : "Error"
          }</div>
          <div class="detail-item"><strong>Redirected:</strong> ${
            selectedRequest.response.redirected ? "Yes" : "No"
          }</div>
          <div class="detail-item"><strong>Response Time:</strong> ${new Date(
            selectedRequest.response.timestamp
          ).toLocaleString()}</div>
          
          <div class="detail-item">
            <strong>Response Headers:</strong>
            ${
              Object.keys(selectedRequest.response.headers).length > 0
                ? `<ul class="headers-list">` +
                  Object.entries(selectedRequest.response.headers)
                    .map(
                      ([key, value]) =>
                        `<li><strong>${key}:</strong> ${value}</li>`
                    )
                    .join("") +
                  `</ul>`
                : "None"
            }
          </div>

          <div class="detail-item">
            <strong>Response Body:</strong>
            <div class="body-container">${renderResponseBody(
              selectedRequest.response.body
            )}</div>
          </div>
          
          ${
            selectedRequest.response.error
              ? `<div class="detail-item error"><strong>Response Error:</strong> ${selectedRequest.response.error}</div>`
              : ""
          }
        `
            : `
          <div class="no-response">
            <p>No response data available.</p>
            ${
              selectedRequest.status === "pending"
                ? "<p><em>Request is still pending...</em></p>"
                : ""
            }
            ${
              selectedRequest.status === "error"
                ? "<p><em>Request failed before completion.</em></p>"
                : ""
            }
            <button id="fetchResponseBtn" class="fetch-btn">Try Fetch Response</button>
          </div>
        `
        }
      </div>
    `;
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
      // Collect edited fields
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
          queryParams.push([parts[0].trim(), parts.slice(1).join(":").trim()]);
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

      console.log("Edited Request to send:", editedReq);
      chrome.runtime.sendMessage(
        { action: "ReplayRequest", request: editedReq },
        (response) => {
          console.log("Response from background:", response);
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
  });
});

editRequest.addEventListener("click", makeFormEditable);
backbtn.addEventListener("click", goBackToMainPage);
