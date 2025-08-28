const backbtn = document.getElementById("backbtn");
document.addEventListener("DOMContentLoaded", () => {
  const detailsDiv = document.querySelector(".details");

  // Load the selected request from storage
  chrome.storage.local.get("selectedRequest", ({ selectedRequest }) => {
    if (!selectedRequest) {
      detailsDiv.innerHTML = `<p>No request selected.</p>`;
      return;
    }

    // Render the request fields
    detailsDiv.innerHTML = `
      <div class="detail-item"><strong>Method:</strong> ${selectedRequest.method}</div>
      <div class="detail-item"><strong>URL:</strong> ${selectedRequest.url}</div>
      <div class="detail-item"><strong>Type:</strong> ${selectedRequest.type}</div>
      <div class="detail-item"><strong>Time:</strong> ${new Date(selectedRequest.timestamp).toLocaleString()}</div>
      <div class="detail-item"><strong>Status:</strong> ${selectedRequest.status || "pending"}</div>
      <div class="detail-item"><strong>Status Code:</strong> ${selectedRequest.statusCode || "-"}</div>
      <div class="detail-item"><strong>Error:</strong> ${selectedRequest.error || "-"}</div>
      
      <div class="detail-item"><strong>Query Params:</strong> 
        ${selectedRequest.queryparams && selectedRequest.queryparams.length > 0
          ? `<ul>` + selectedRequest.queryparams.map(q => `<li>${q[0]}: ${q[1]}</li>`).join("") + `</ul>`
          : "None"}
      </div>

      <div class="detail-item"><strong>Headers:</strong>
        ${selectedRequest.headers && selectedRequest.headers.length > 0
          ? `<ul>` + selectedRequest.headers.map(h => `<li>${h.name}: ${h.value}</li>`).join("") + `</ul>`
          : "None"}
      </div>
    `;
  });
});


function goBackToMainPage() {
    window.location.href = "popup.html";
}

backbtn.addEventListener("click", goBackToMainPage);
