document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? `<div class="participants-section">
              <h5>Participants</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (participant) => `
                      <li class="participant-item">
                        <span class="participant-name">${participant}</span>
                        <button
                          type="button"
                          class="participant-remove-btn"
                          data-activity="${name}"
                          data-email="${participant}"
                          aria-label="Remove ${participant}"
                        >
                          <span aria-hidden="true">🗑️</span>
                        </button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<div class="participants-section empty">
              <h5>Participants</h5>
              <p class="participants-empty">Be the first to sign up!</p>
            </div>`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <h4>${name}</h4>
            <span class="availability-pill">${spotsLeft} spots left</span>
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".participant-remove-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const activity = button.dataset.activity;
          const email = button.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
              {
                method: "DELETE",
                cache: "no-store",
              }
            );

            const result = await response.json();

            if (response.ok) {
              showMessage(result.message, "success");
              await fetchActivities();
            } else {
              showMessage(result.detail || "Failed to remove participant.", "error");
            }
          } catch (error) {
            showMessage("Failed to remove participant. Please try again.", "error");
            console.error("Error removing participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
