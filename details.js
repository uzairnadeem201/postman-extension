const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");

const detailsDiv = document.getElementById("details");

chrome.runtime.sendMessage({ action: "GetRequestById", id: requestId }, (response) => {
    if (response.success && response.request) {
        const req = response.request;

        detailsDiv.innerHTML = `
            <h3>${req.method} ${req.url}</h3>
            <p><b>Type:</b> ${req.type}</p>
            <p><b>Time:</b> ${new Date(req.timestamp).toLocaleString()}</p>
            <p><b>Status:</b> ${req.status || "N/A"}</p>
            <h4>Query Params:</h4>
            <pre>${JSON.stringify(req.queryParams, null, 2)}</pre>
            <h4>Headers:</h4>
            <pre>${JSON.stringify(req.sentHeaders || {}, null, 2)}</pre>
            <h4>Body:</h4>
            <pre>${JSON.stringify(req.requestBody || {}, null, 2)}</pre>
            <h4>Error:</h4>
            <pre>${req.error || "None"}</pre>
        `;
    } else {
        detailsDiv.textContent = "Request not found!";
    }
});
