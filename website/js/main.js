/**
 * autocad-mcp website — Stripe Checkout integration
 *
 * Flow:
 * 1. User enters Machine ID → validates (24 hex chars)
 * 2. User clicks Buy → calls Netlify function to create Stripe Checkout session
 * 3. Stripe handles payment, billing address, receipt
 * 4. After payment → redirect to success page with session ID
 * 5. Success page retrieves generated license key
 */

(function () {
  "use strict";

  const machineIdInput = document.getElementById("machineId");
  const validateBtn = document.getElementById("validateMachineId");
  const errorText = document.getElementById("machineIdError");
  const successText = document.getElementById("machineIdSuccess");
  const buyButtons = document.querySelectorAll(".btn-buy");

  let validMachineId = null;

  // Validate Machine ID format
  function isValidMachineId(id) {
    return /^[a-f0-9]{24}$/.test(id.trim().toLowerCase());
  }

  // Validate button click
  validateBtn.addEventListener("click", function () {
    const id = machineIdInput.value.trim().toLowerCase();
    errorText.style.display = "none";
    successText.style.display = "none";

    if (!id) {
      errorText.textContent = "Please enter your Machine ID.";
      errorText.style.display = "block";
      return;
    }

    if (!isValidMachineId(id)) {
      errorText.textContent =
        "Invalid Machine ID format. It should be 24 hex characters (e.g. 6409a367862ae812f6b4e472). Run: node dist/index.js --license";
      errorText.style.display = "block";
      return;
    }

    validMachineId = id;
    successText.style.display = "block";

    // Enable buy buttons
    buyButtons.forEach(function (btn) {
      btn.disabled = false;
    });
  });

  // Also validate on Enter key
  machineIdInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      validateBtn.click();
    }
  });

  // Buy button click — create Stripe Checkout session
  buyButtons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      if (!validMachineId) return;

      const plan = btn.getAttribute("data-plan");
      btn.disabled = true;
      btn.textContent = "Processing...";

      try {
        const response = await fetch("/.netlify/functions/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: plan,
            machineId: validMachineId,
          }),
        });

        const data = await response.json();

        if (data.error) {
          alert("Error: " + data.error);
          btn.disabled = false;
          btn.textContent = plan === "monthly" ? "Buy Monthly License" : "Buy Yearly License";
          return;
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        alert("Network error. Please try again.");
        btn.disabled = false;
        btn.textContent = plan === "monthly" ? "Buy Monthly License" : "Buy Yearly License";
      }
    });
  });
})();
