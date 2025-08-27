const tbody = document.getElementById("requestsBody");
const refreshBtn = document.getElementById("refresh");
const listPage = document.getElementById("listPage");
const detailsPage = document.getElementById("detailsPage");
const backBtn = document.getElementById("backBtn");
const detailsContent = document.getElementById("detailsContent");

function renderRequests() {
    chrome.runtime.sendMessage({ action: "GetRequests" }, (response) => {
        const requests = response.requests || [];
        tbody.innerHTML = "";

        requests.forEach(req => {
            const tr = document.createElement("tr");
            const time = new Date(req.timestamp).toLocaleTimeString();

            tr.innerHTML = `
                <td>${req.method}</td>
                <td title="${req.url}">${req.url}</td>
                <td>${req.type}</td>
                <td>${time}</td>
            `;
            tr.addEventListener("click", () => {
                showDetails(req);
            });

            tbody.appendChild(tr);
        });
    });
}

function showDetails(req) {
    listPage.classList.add("hidden");
    detailsPage.classList.remove("hidden");
    detailsContent.textContent = JSON.stringify(req, null, 2);
}

backBtn.addEventListener("click", () => {
    detailsPage.classList.add("hidden");
    listPage.classList.remove("hidden");
});

renderRequests();
refreshBtn.addEventListener("click", renderRequests);
