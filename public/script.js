// Frontend API paths stay relative so the app works on localhost or deployment.
const API_URL = "/books";

function checkAdmin() {
  if (localStorage.getItem("isAdmin") !== "true") {
    alert("Please sign in as an admin to continue.");
    window.location.href = "admin-login.html";
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHTML(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function readJSON(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

/* ---------------- ADD BOOK ---------------- */
async function addBook() {
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  if (!title || !author) return alert("Please enter both the book title and author.");
  try {
    const response = await fetch(`${API_URL}/add`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author })
    });
    const data = await readJSON(response);
    alert(data.message || "Book added successfully.");
    document.getElementById("title").value = "";
    document.getElementById("author").value = "";
  } catch (error) { alert(error.message || "Could not add the book."); }
}

/* ---------------- UPLOAD CSV ---------------- */
async function uploadCSV() {
  const fileInput = document.getElementById("csvFile");
  if (!fileInput || !fileInput.files.length) return alert("Please select a CSV file first.");
  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith(".csv")) return alert("Please choose a .csv file.");
  const formData = new FormData();
  formData.append("csvFile", file);
  try {
    const response = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
    const data = await readJSON(response);
    alert(data.message || "CSV uploaded successfully.");
    fileInput.value = "";
  } catch (error) { alert(error.message || "CSV upload failed."); }
}

function renderBooks(books) {
  const tableBody = document.getElementById("bookTable");
  if (!tableBody) return;
  if (!Array.isArray(books) || books.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No books found. Try another search or add a new title.</td></tr>';
    return;
  }
  tableBody.innerHTML = books.map(book => `
    <tr>
      <td>${escapeHTML(book.id)}</td>
      <td>${escapeHTML(book.title)}</td>
      <td>${escapeHTML(book.author)}</td>
      <td>${formatDate(book.published_date)}</td>
    </tr>`).join("");
}

/* ---------------- LOAD BOOKS ---------------- */
async function loadBooks() {
  const tableBody = document.getElementById("bookTable");
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Loading your books…</td></tr>';
  try {
    const response = await fetch(`${API_URL}/list`);
    renderBooks(await readJSON(response));
  } catch (error) {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Could not load books. Check that the server and database are running.</td></tr>';
    console.error(error);
  }
}

async function loadDashboardStats() {
  const counter = document.getElementById("totalBooks");
  if (!counter) return;
  try {
    const response = await fetch(`${API_URL}/list`);
    const books = await readJSON(response);
    counter.textContent = Array.isArray(books) ? books.length.toLocaleString("en-IN") : "0";
  } catch (error) {
    counter.textContent = "—";
    console.error("Could not load dashboard stats:", error);
  }
}

/* ---------------- UPDATE BOOK ---------------- */
async function updateBook() {
  const id = document.getElementById("id").value.trim();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  if (!id || Number(id) < 1 || !title || !author) return alert("Enter a valid book ID, title, and author.");
  try {
    const response = await fetch(`${API_URL}/update/${encodeURIComponent(id)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author })
    });
    const data = await readJSON(response);
    alert(data.message || "Book updated successfully.");
  } catch (error) { alert(error.message || "Update failed."); }
}

/* ---------------- DELETE BOOK ---------------- */
async function deleteBook() {
  const id = document.getElementById("id").value.trim();
  if (!id || Number(id) < 1) return alert("Please enter a valid book ID.");
  if (!confirm(`Are you sure you want to remove book ID ${id}?`)) return;
  try {
    const response = await fetch(`${API_URL}/delete/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await readJSON(response);
    alert(data.message || "Book removed successfully.");
    document.getElementById("id").value = "";
  } catch (error) { alert(error.message || "Delete failed."); }
}

/* ---------------- SEARCH BOOKS ---------------- */
async function searchBooks() {
  const input = document.getElementById("searchInput");
  const keyword = input ? input.value.trim() : "";
  if (!keyword) return loadBooks();
  const tableBody = document.getElementById("bookTable");
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Searching…</td></tr>';
  try {
    const response = await fetch(`${API_URL}/search?keyword=${encodeURIComponent(keyword)}`);
    renderBooks(await readJSON(response));
  } catch (error) {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Search failed. Please try again.</td></tr>';
    console.error(error);
  }
}

/* ---------------- ADMIN SIGNUP ---------------- */
async function adminSignup() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) return alert("Please enter a username and password.");
  try {
    const response = await fetch("/admin/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await readJSON(response);
    alert(data.message || "Signup successful. Please sign in.");
    window.location.href = "admin-login.html";
  } catch (error) { alert(error.message || "Signup failed."); }
}

/* ---------------- ADMIN LOGIN ---------------- */
async function adminLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) return alert("Please enter both username and password.");
  try {
    const response = await fetch("/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      localStorage.setItem("isAdmin", "true");
      window.location.href = "dashboard.html";
    } else alert(data.message || "Invalid username or password.");
  } catch (error) { console.error(error); alert("Login failed. Check that the server is running."); }
}

function logout() {
  localStorage.removeItem("isAdmin");
  window.location.href = "admin-login.html";
}

function updateNavbar() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const signup = document.getElementById("signupLink");
  const login = document.getElementById("loginLink");
  const logoutButton = document.getElementById("logoutBtn");
  if (signup) signup.style.display = isAdmin ? "none" : "inline-block";
  if (login) login.style.display = isAdmin ? "none" : "inline-block";
  if (logoutButton) logoutButton.style.display = isAdmin ? "inline-flex" : "none";
}
