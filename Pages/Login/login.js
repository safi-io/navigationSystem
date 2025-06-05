import { authenticationData } from "../../Utils/authenticationData.js";

const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

loginBtn.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (
    authenticationData[username] &&
    authenticationData[username] === password
  ) {
    loginMessage.textContent = "✅ Login successful!";
    loginMessage.style.color = "#4caf50";

    // Optional: Redirect or hide login box after login
    window.location.href = "../Navigation/index.html";
  } else {
    loginMessage.textContent = "❌ Invalid username or password!";
    loginMessage.style.color = "#f44336";
  }
});

// Optional: submit form on enter key
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});
