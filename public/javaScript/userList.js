document.addEventListener("DOMContentLoaded", function () {
    const exportBtn = document.getElementById("exportCsvBtn");

    exportBtn.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default behavior

        // Get the applied filter values from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get("status");
        const startDate = urlParams.get("startDate");
        const endDate = urlParams.get("endDate");

        // Construct the export URL dynamically
        let exportUrl = "/api/admin/export-csv";
        let queryParams = [];

        if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
        if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
        if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);

        if (queryParams.length > 0) {
            exportUrl += "?" + queryParams.join("&");
        }

        // Redirect to the new export URL
        window.location.href = exportUrl;
    });
});

    
    async function toggleUserStatus(userId, currentStatus) {
        try {
          const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
          const response = await fetch('/api/admin/user/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              status: newStatus
            })
          });

          const data = await response.json();
          if (data.success) {
            // Reload the page to update the stats
            window.location.reload();
          } else {
            alert('Error updating user status');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error updating user status');
        }
      }
      
      document.getElementById("applyFilter").addEventListener("click", function () {
  let status = document.getElementById("statusFilter").value;
  let dateFilter = document.getElementById("dateFilter").value;
  let startDate = document.getElementById("startDate").value;
  let endDate = document.getElementById("endDate").value;

  const today = new Date();

  // Function to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

  // Generate date ranges
  const getDateRange = (filter) => {
    const tempDate = new Date();
    switch (filter) {
      case "today":
        return [formatDate(today), formatDate(today)];
      case "yesterday":
        tempDate.setDate(today.getDate() - 1);
        return [formatDate(tempDate), formatDate(tempDate)];
      case "thisWeek":
        tempDate.setDate(today.getDate() - today.getDay());
        return [formatDate(tempDate), formatDate(today)];
      case "lastWeek":
        const firstDayLastWeek = new Date();
        firstDayLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const lastDayLastWeek = new Date();
        lastDayLastWeek.setDate(today.getDate() - today.getDay() - 1);
        return [formatDate(firstDayLastWeek), formatDate(lastDayLastWeek)];
      case "thisMonth":
        return [formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), formatDate(today)];
      case "lastMonth":
        return [
          formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
          formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
        ];
      case "custom":
        // Do not override startDate and endDate if "custom" is selected
        return [startDate, endDate];
      default:
        return ["", ""];
    }
  };

  // Only update startDate and endDate if NOT using custom
  if (dateFilter !== "custom") {
    [startDate, endDate] = getDateRange(dateFilter);
  }

  // Debugging logs
  console.log("Status:", status);
  console.log("Date Filter:", dateFilter);
  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);

  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);
  if (startDate && endDate) {
    queryParams.append("startDate", startDate);
    queryParams.append("endDate", endDate);
  }

  window.location.href = `/api/admin/user/list?${queryParams}`;
});

document.getElementById("exportCsvBtn").addEventListener("click", function (event) {
    event.preventDefault();

    let status = document.getElementById("statusFilter").value; // Ensure this element exists in your UI
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let dateFilter = document.getElementById("dateFilter").value;

    const today = new Date();
    const formatDate = (date) => date.toISOString().split("T")[0];

    // Generate date range
    const getDateRange = (filter) => {
        const tempDate = new Date();
        switch (filter) {
            case "today":
                return [formatDate(today), formatDate(today)];
            case "yesterday":
                tempDate.setDate(today.getDate() - 1);
                return [formatDate(tempDate), formatDate(tempDate)];
            case "thisWeek":
                tempDate.setDate(today.getDate() - today.getDay());
                return [formatDate(tempDate), formatDate(today)];
            case "lastWeek":
                const firstDayLastWeek = new Date();
                firstDayLastWeek.setDate(today.getDate() - today.getDay() - 7);
                const lastDayLastWeek = new Date();
                lastDayLastWeek.setDate(today.getDate() - today.getDay() - 1);
                return [formatDate(firstDayLastWeek), formatDate(lastDayLastWeek)];
            case "thisMonth":
                return [formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), formatDate(today)];
            case "lastMonth":
                return [
                    formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                    formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
                ];
            case "custom":
                return [startDate, endDate];
            default:
                return ["", ""];
        }
    };

    if (dateFilter !== "custom") {
        [startDate, endDate] = getDateRange(dateFilter);
    }

    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (startDate && endDate) {
        queryParams.append("startDate", startDate);
        queryParams.append("endDate", endDate);
    }

    console.log("Exporting with filters:", queryParams.toString()); // Debugging line

    // Redirect to the CSV export route with filters
    window.location.href = `/api/admin/export-csv?${queryParams}`;
});
