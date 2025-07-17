document.addEventListener("DOMContentLoaded", () => {
  // --- Animated Git Branch Lines Background ---
  const canvas = document.getElementById('git-branches-bg');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Branch line data
    const branches = [];
    const branchCount = 7;
    for (let i = 0; i < branchCount; i++) {
      branches.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.2 + Math.random() * 0.3,
        color: i % 2 === 0 ? '#b6e94a' : '#7bb800',
        points: Array.from({length: 8}, (_, j) => ({
          dx: (Math.random() - 0.5) * 40,
          dy: (Math.random() - 0.5) * 40
        }))
      });
    }

    function drawBranches() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      branches.forEach(branch => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(branch.x, branch.y);
        let px = branch.x, py = branch.y;
        branch.points.forEach((pt, idx) => {
          px += pt.dx;
          py += pt.dy;
          ctx.lineTo(px, py);
        });
        ctx.strokeStyle = branch.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.18;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      });
    }

    function animate() {
      // Animate branch points
      branches.forEach(branch => {
        branch.points.forEach(pt => {
          pt.dx += (Math.random() - 0.5) * 0.7;
          pt.dy += (Math.random() - 0.5) * 0.7;
          pt.dx = Math.max(-60, Math.min(60, pt.dx));
          pt.dy = Math.max(-60, Math.min(60, pt.dy));
        });
      });
      drawBranches();
      requestAnimationFrame(animate);
    }
    animate();
  }
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");

  let allActivities = {};

  // Helper to get category from activity name
  function getCategory(name) {
    if (name.includes("Club")) return "Club";
    if (name.includes("Class")) return "Class";
    if (name.includes("Team")) return "Team";
    return "Other";
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Filter
    let filtered = Object.entries(allActivities).filter(([name, details]) => {
      const search = searchInput.value.trim().toLowerCase();
      const category = categoryFilter.value;
      let matchesSearch =
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search);
      let matchesCategory =
        !category || getCategory(name) === category;
      return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortFilter.value === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortFilter.value === "schedule") {
      filtered.sort((a, b) => a[1].schedule.localeCompare(b[1].schedule));
    }

    // Render
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Filter, sort, and search event listeners
  searchInput.addEventListener("input", renderActivities);
  categoryFilter.addEventListener("change", renderActivities);
  sortFilter.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
