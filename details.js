const backbtn = document.getElementById("backbtn");

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
      
      if (typeof body === 'object') {
        return `<pre class="json-body">${formatJSON(body)}</pre>`;
      } else if (typeof body === 'string') {
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
        return `<pre>${requestBody.join('\n')}</pre>`;
      } else if (typeof requestBody === 'object') {
        if (requestBody.formData) {
          return `<ul>` + Object.entries(requestBody.formData).map(([key, values]) => 
            `<li><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</li>`
          ).join("") + `</ul>`;
        } else {
          return `<pre class="json-body">${formatJSON(requestBody)}</pre>`;
        }
      }
      return `<pre>${requestBody}</pre>`;
    }

    // Render the request fields with response data
    detailsDiv.innerHTML = `
      <div class="request-section">
        <h3>Request Information</h3>
        <div class="detail-item"><strong>Method:</strong> ${selectedRequest.method}</div>
        <div class="detail-item"><strong>URL:</strong> <span class="url-text">${selectedRequest.url}</span></div>
        <div class="detail-item"><strong>Type:</strong> ${selectedRequest.type}</div>
        <div class="detail-item"><strong>Time:</strong> ${new Date(selectedRequest.timestamp).toLocaleString()}</div>
        <div class="detail-item"><strong>Status:</strong> <span class="status-${selectedRequest.status}">${selectedRequest.status || "pending"}</span></div>
        <div class="detail-item"><strong>Status Code:</strong> ${selectedRequest.statusCode || "-"}</div>
        ${selectedRequest.error ? `<div class="detail-item error"><strong>Error:</strong> ${selectedRequest.error}</div>` : ""}
        
        <div class="detail-item">
          <strong>Query Params:</strong> 
          ${selectedRequest.queryParams && selectedRequest.queryParams.length > 0
            ? `<ul class="params-list">` + selectedRequest.queryParams.map(q => `<li><strong>${q[0]}:</strong> ${q[1]}</li>`).join("") + `</ul>`
            : "None"}
        </div>

        <div class="detail-item">
          <strong>Request Headers:</strong>
          ${selectedRequest.headers && selectedRequest.headers.length > 0
            ? `<ul class="headers-list">` + selectedRequest.headers.map(h => `<li><strong>${h.name}:</strong> ${h.value}</li>`).join("") + `</ul>`
            : "None"}
        </div>

        <div class="detail-item">
          <strong>Request Body:</strong>
          <div class="body-container">${renderRequestBody(selectedRequest.body)}</div>
        </div>
      </div>

      <div class="response-section">
        <h3>Response Information</h3>
        ${selectedRequest.response ? `
          <div class="detail-item"><strong>Response Status:</strong> <span class="response-status-${selectedRequest.response.ok ? 'success' : 'error'}">${selectedRequest.response.status} ${selectedRequest.response.statusText}</span></div>
          <div class="detail-item"><strong>Response URL:</strong> <span class="url-text">${selectedRequest.response.url}</span></div>
          <div class="detail-item"><strong>OK:</strong> ${selectedRequest.response.ok ? "OK" : 'Error'}</div>
          <div class="detail-item"><strong>Redirected:</strong> ${selectedRequest.response.redirected ? 'Yes' : 'No'}</div>
          <div class="detail-item"><strong>Response Time:</strong> ${new Date(selectedRequest.response.timestamp).toLocaleString()}</div>
          
          <div class="detail-item">
            <strong>Response Headers:</strong>
            ${Object.keys(selectedRequest.response.headers).length > 0
              ? `<ul class="headers-list">` + Object.entries(selectedRequest.response.headers).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join("") + `</ul>`
              : "None"}
          </div>

          <div class="detail-item">
            <strong>Response Body:</strong>
            <div class="body-container">${renderResponseBody(selectedRequest.response.body)}</div>
          </div>
          
          ${selectedRequest.response.error ? `<div class="detail-item error"><strong>Response Error:</strong> ${selectedRequest.response.error}</div>` : ""}
        ` : `
          <div class="no-response">
            <p>No response data available.</p>
            ${selectedRequest.status === 'pending' ? '<p><em>Request is still pending...</em></p>' : ''}
            ${selectedRequest.status === 'error' ? '<p><em>Request failed before completion.</em></p>' : ''}
            <button id="fetchResponseBtn" class="fetch-btn">Try Fetch Response</button>
          </div>
        `}
      </div>
    `;  
  });
});

function goBackToMainPage() {
    window.location.href = "popup.html";
}

backbtn.addEventListener("click", goBackToMainPage);