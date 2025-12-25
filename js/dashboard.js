// ==========================================
// 1. IMPORTS & CONFIGURATION
// ==========================================
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updatePassword,
} from "./firebase-config.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const contentArea = document.getElementById("dynamic-content");
const pageTitle = document.getElementById("page-header-title");
const globalSearchInput = document.getElementById("globalSearch");

// Global State Management
let currentViewName = "dashboard";
let globalResources = [];
let globalResults = [];
let unsubscribeNotifs = null;

// Cloudinary Configuration
const CLOUD_NAME = "dx7ckwryz";
const UPLOAD_PRESET = "EduSpark";

// ==========================================
// 2. UTILITY FUNCTIONS
// ==========================================

// Loader UI
function showContentLoader() {
  contentArea.innerHTML = `
        <div class="page-loader">
            <div class="page-spinner"></div>
            <p>Loading data...</p>
        </div>`;
}

// Time Formatter
function timeAgo(date) {
  if (!date) return "Just now";
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

// ==========================================
// 3. HTML VIEW GENERATORS
// ==========================================

const ViewDashboard = (user) => `
    <div class="dash-stats">
        <div class="stat-card">
            <div class="stat-icon purple"><i class="ri-book-mark-line"></i></div>
            <div><h3 id="stat-courses">0</h3><p>Active Courses</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue"><i class="ri-file-list-3-line"></i></div>
            <div><h3 id="stat-tests">0</h3><p>Tests Taken</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green"><i class="ri-trophy-line"></i></div>
            <div><h3 id="stat-rank">NA</h3><p>Best Rank</p></div>
        </div>
    </div>
    
    <div class="content-grid">
        <div class="card-box">
            <h3>📢 Notices</h3>
            <div id="notices-container" class="mt-3">
                <p class="text-muted">Loading...</p>
            </div>
        </div>
        <div class="card-box">
            <h3>📅 Live Classes</h3>
            <div class="table-responsive">
                <table class="styled-table">
                    <thead><tr><th>Subject</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody id="dashboard-schedule-container"><tr><td colspan="3">Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
    </div>`;

const ViewCourses = () => `
    <div class="card-box">
        <h3>🎓 My Enrolled Courses</h3>
        <div id="my-courses-list" class="flex-list">
            <p>Loading your courses...</p>
        </div>
    </div>
    <div class="card-box">
        <h3>🚀 Explore New Courses</h3>
        <div id="all-courses-list" class="flex-list">
            <p>Loading available courses...</p>
        </div>
    </div>`;

const ViewTimetable = () => `
    <div class="card-box">
        <h3>🗓️ Weekly Schedule</h3>
        <div id="full-timetable-container" class="grid-gap-20">
            <p>Loading schedule...</p>
        </div>
    </div>`;

const ViewResources = () => `
    <div class="card-box">
        <div class="card-header">
            <h3>📚 Study Materials</h3>
        </div>
        <div class="filter-container">
            <button class="filter-btn active" onclick="filterBySubject('All', this)">All</button>
            <button class="filter-btn" onclick="filterBySubject('Physics', this)">Physics</button>
            <button class="filter-btn" onclick="filterBySubject('Chemistry', this)">Chemistry</button>
            <button class="filter-btn" onclick="filterBySubject('Maths', this)">Maths</button>
        </div>
        <div id="resource-list-container"><p>Loading resources...</p></div>
    </div>`;

const ViewResults = () => `
    <div class="card-box">
        <div class="card-header">
            <h3>🏆 Exam Performance</h3>
        </div>
        <div class="table-responsive">
            <table class="styled-table">
                <thead><tr><th>Exam Name</th><th>Date</th><th>Score</th><th>Rank</th><th>Status</th><th>Action</th></tr></thead>
                <tbody id="result-list-container"><tr><td colspan="6" style="text-align:center;">Loading results...</td></tr></tbody>
            </table>
        </div>
    </div>`;

const ViewSettings = (user) => {
  // Determine Avatar HTML based on user photo
  const photoHTML = user.photoURL
    ? `<img src="${user.photoURL}" id="settings-avatar-img" class="avatar-img">`
    : `<div class="avatar-placeholder">${
        user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"
      }</div>`;

  return `
    <div class="settings-wrapper">
        <div class="card-header">
            <h3>⚙️ Account Settings</h3>
        </div>

        <div class="settings-grid">
            
            <div class="card-box settings-card profile">
                <h4 class="settings-title text-primary">👤 Profile Details</h4>
                
                <div class="avatar-wrapper">
                    <div class="avatar-box">
                        ${photoHTML}
                        <label for="file-upload" class="camera-icon-label">
                            <i class="ri-camera-line"></i>
                        </label>
                        <input type="file" id="file-upload" accept="image/*" style="display:none;">
                    </div>
                    <p class="text-muted" style="margin-top:10px; font-size:0.85rem;">Update Profile Photo</p>
                </div>

                <form id="profile-form">
                    <div class="form-group">
                        <label class="form-label">Display Name</label>
                        <input type="text" id="set-name" class="form-control" value="${
                          user.displayName || ""
                        }">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control" value="${
                          user.email
                        }" disabled>
                    </div>
                    <button type="submit" id="profile-btn" class="btn-block btn-primary">Update Profile</button>
                </form>
            </div>

            <div class="card-box settings-card security">
                <h4 class="settings-title text-danger">🔒 Security & Password</h4>
                
                <form id="pass-form">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" id="old-pass" class="form-control" placeholder="Enter current password" required autocomplete="current-password">
                    </div>

                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" id="new-pass" class="form-control" placeholder="Min 6 characters" required autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" id="confirm-pass" class="form-control" placeholder="Re-enter new password" required autocomplete="new-password">
                    </div>

                    <button type="submit" id="pass-btn" class="btn-block btn-secondary">Change Password</button>
                </form>

                <hr style="margin: 25px 0; border: 0; border-top: 1px dashed #e2e8f0;">

                <div class="text-center">
                    <p class="text-muted" style="margin-bottom: 10px; font-size: 0.9rem;">Forgot your current password?</p>
                    <button id="forgot-pass-btn" class="btn-link">
                        Send Password Reset Email
                    </button>
                </div>
            </div>

        </div>
    </div>`;
};

const ViewFeedback = (user) => `
    <div class="card-box feedback-wrapper">
        <div class="text-center" style="margin-bottom: 20px;">
            <h3 style="font-size: 1.5rem; color: var(--primary-color);">💬 Share Your Experience</h3>
            <p class="text-muted">How was your learning journey?</p>
        </div>
        <form id="student-review-form">
            <div class="form-group">
                <label class="form-label">Your Name</label>
                <input type="text" class="form-control" value="${
                  user.displayName || ""
                }" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">Your Achievement / Class</label>
                <input type="text" id="stu-sub" class="form-control" placeholder="e.g. JEE Aspirant or 95% in Boards" required>
            </div>
            <div class="form-group">
                <label class="form-label">Rating</label>
                <select id="stu-rating" class="form-control">
                    <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (Good)</option>
                    <option value="3">⭐⭐⭐ (Average)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Your Review</label>
                <textarea id="stu-msg" rows="4" class="form-control" placeholder="Write your feedback here..." required></textarea>
            </div>
            <button type="submit" class="btn-block btn-primary" style="margin-top: 10px;">Submit Review 🚀</button>
        </form>
    </div>`;

// ==========================================
// 4. DATA LOADERS (LOGIC & API CALLS)
// ==========================================

// Load Notices
async function loadNotices() {
  const container = document.getElementById("notices-container");
  if (!container) return;
  try {
    const q = query(collection(db, "notices"));
    const querySnapshot = await getDocs(q);
    let html = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const color = data.type === "alert" ? "#ef4444" : "#3b82f6";
      const bg = data.type === "alert" ? "#fef2f2" : "#eff6ff";
      const timeDisplay = data.timestamp
        ? timeAgo(data.timestamp.toDate())
        : data.date;
      html += `<div class="resource-row" style="background: ${bg}; border-left: 4px solid ${color}; padding: 15px;">
                    <i class="ri-notification-badge-line" style="color: ${color}; font-size: 1.2rem; margin-right:15px;"></i>
                    <div class="res-details"><h4 style="margin-bottom:2px;">${data.title}</h4>
                    <p style="font-size:0.85rem; color:#64748b;">${data.message}</p>
                    <span style="font-size:0.75rem; color:#94a3b8; display:block; margin-top:4px;">${timeDisplay}</span></div></div>`;
    });
    container.innerHTML = html || "<p>No notices.</p>";
  } catch (e) {
    container.innerHTML = "Error loading notices.";
  }
}

// Load Courses (PERFORMANCE FIX: Promise.all used)
async function loadCoursesLogic(userId) {
  const enrolledContainer = document.getElementById("my-courses-list");
  const allContainer = document.getElementById("all-courses-list");

  try {
    // 1. Fetch Enrolled Courses
    const enrolledSnap = await getDocs(
      collection(db, "users", userId, "enrolled_courses")
    );
    let enrolledIds = [];
    let enrolledHTML = "";

    if (enrolledSnap.empty) {
      enrolledHTML = "<p style='color:#94a3b8;'>No enrolled courses yet.</p>";
    } else {
      // FIX: Use Promise.all to fetch course details in parallel (Faster)
      const coursePromises = enrolledSnap.docs.map((item) => {
        enrolledIds.push(item.id);
        return getDoc(doc(db, "courses", item.id));
      });

      const courseDocs = await Promise.all(coursePromises);

      courseDocs.forEach((courseDoc) => {
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          const id = courseDoc.id;

          let imgStyle =
            data.image && data.image.startsWith("http")
              ? `background: url('${data.image}') center/cover no-repeat;`
              : `background: linear-gradient(135deg, #6366f1, #a855f7);`;

          enrolledHTML += `
                    <div style="background:#fff; padding:15px; border-radius:15px; width:250px; border:1px solid #e2e8f0; flex-shrink:0;">
                        <div style="height:120px; ${imgStyle} border-radius:10px; margin-bottom:10px;"></div>
                        <h4 style="font-size:0.95rem; margin-bottom:5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
                          data.title
                        }</h4>
                        <div style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">${
                          data.category || "General"
                        }</div>
                        <button onclick="window.location.href='classroom.html?id=${id}'" style="width:100%; padding:8px; background:#e0e7ff; color:#6366f1; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Continue Learning</button>
                    </div>`;
        }
      });
    }
    if (enrolledContainer)
      enrolledContainer.innerHTML =
        enrolledHTML || "<p>No active courses found.</p>";

    // 2. Fetch All Courses for Explore Section
    const allSnap = await getDocs(collection(db, "courses"));
    let allHTML = "";

    allSnap.forEach((doc) => {
      if (!enrolledIds.includes(doc.id)) {
        const data = doc.data();
        let imgStyle =
          data.image && data.image.startsWith("http")
            ? `background: url('${data.image}') center/cover no-repeat;`
            : `background: #f1f5f9; display:flex; align-items:center; justify-content:center;`;

        const content =
          data.image && data.image.startsWith("http")
            ? ``
            : `<i class="ri-book-line" style="font-size:2rem; color:#94a3b8;"></i>`;

        allHTML += `
                <div style="background:#fff; padding:15px; border-radius:15px; width:250px; border:1px solid #e2e8f0; flex-shrink:0;">
                    <div style="height:120px; ${imgStyle} border-radius:10px; margin-bottom:10px;">${content}</div>
                    <h4 style="font-size:0.95rem; margin-bottom:5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${data.title}</h4>
                    <p style="font-size:0.8rem; color:#64748b;">${data.category}</p>
                    <button onclick="enrollInCourse('${doc.id}', '${data.title}')" style="width:100%; padding:8px; margin-top:10px; background:var(--primary-color); color:#fff; border:none; border-radius:6px; cursor:pointer;">Enroll Now</button>
                </div>`;
      }
    });
    if (allContainer)
      allContainer.innerHTML = allHTML || "<p>No new courses available.</p>";
  } catch (e) {
    console.error("Error loading courses:", e);
    if (enrolledContainer)
      enrolledContainer.innerHTML = "<p>Error loading courses.</p>";
  }
}

// Load Schedule (CRASH FIX: Check if day exists)
async function loadSchedule(isDashboard) {
  const id = isDashboard
    ? "dashboard-schedule-container"
    : "full-timetable-container";
  const container = document.getElementById(id);
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "schedule"));

    if (isDashboard) {
      let html = "";
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (count < 3) {
          html += `<tr><td><strong>${data.subject}</strong></td><td>${data.time}</td><td>${data.status}</td></tr>`;
          count++;
        }
      });
      container.innerHTML = html || "<tr><td colspan='3'>No classes.</td></tr>";
    } else {
      let days = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // FIX: Check if the day from DB exists in our object to prevent crashes
        if (data.day && days.hasOwnProperty(data.day)) {
          days[data.day].push(data);
        }
      });

      let html = "";
      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      dayOrder.forEach((day) => {
        const classes = days[day];
        if (classes.length > 0) {
          html += `<div style="background:#fff; padding:20px; border-radius:15px; border:1px solid #e2e8f0;">
                <h4 style="color:var(--primary-color); margin-bottom:15px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">${day}</h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
                    ${classes
                      .map(
                        (c) =>
                          `<div class="class-card"><span class="subject-tag">${c.subject}</span><span class="teacher-name">${c.teacher}</span><div style="margin-top:10px; font-size:0.85rem; color:#64748b;"><i class="ri-time-line"></i> ${c.time}</div></div>`
                      )
                      .join("")}
                </div></div>`;
        }
      });
      container.innerHTML = html || "<p>No schedule found.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p>Error loading schedule.</p>";
  }
}

// Load Resources
async function loadResources() {
  const container = document.getElementById("resource-list-container");
  try {
    const querySnapshot = await getDocs(collection(db, "resources"));
    globalResources = [];
    querySnapshot.forEach((doc) => globalResources.push(doc.data()));
    renderResources(globalResources);
  } catch (e) {
    container.innerHTML = "<p>Error loading resources.</p>";
  }
}

function renderResources(data) {
  const container = document.getElementById("resource-list-container");
  if (!container) return;
  if (data.length === 0) {
    container.innerHTML =
      "<p style='padding:20px; color:#94a3b8;'>No resources found.</p>";
    return;
  }
  container.innerHTML = data
    .map(
      (item) => `
        <div class="resource-row">
            <i class="${
              item.type === "PDF" ? "ri-file-pdf-fill" : "ri-image-fill"
            } res-icon" style="color:${
        item.type === "PDF" ? "#ef4444" : "#3b82f6"
      };"></i>
            <div class="res-details" style="flex:1;"><h4>${item.title}</h4><p>${
        item.subject
      } • ${item.type}</p></div>
            <button onclick="handleDownload('${item.link}', '${
        item.title
      }')" class="btn-secondary" style="padding:8px 15px; font-size:0.8rem;">Download</button>
        </div>`
    )
    .join("");
}

// Load Results
async function loadResults() {
  const container = document.getElementById("result-list-container");
  const user = auth.currentUser;
  if (!user || !container) return;
  try {
    const q = query(
      collection(db, "results"),
      where("studentEmail", "==", user.email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    globalResults = [];
    querySnapshot.forEach((doc) => globalResults.push(doc.data()));
    renderResults(globalResults);
  } catch (e) {
    console.error(e);
    container.innerHTML =
      "<tr><td colspan='6'>Error loading results.</td></tr>";
  }
}

function renderResults(data) {
  const container = document.getElementById("result-list-container");
  if (!container) return;
  if (data.length === 0) {
    container.innerHTML =
      "<tr><td colspan='6' style='text-align:center;'>No results.</td></tr>";
    return;
  }
  container.innerHTML = data
    .map(
      (item) => `<tr><td>${item.examName}</td><td>${
        item.date
      }</td><td><strong>${item.score}</strong></td>
            <td>#${item.rank}</td><td><span class="status-badge ${
        item.status === "pass" ? "pass" : "fail"
      }">${item.status}</span></td>
            <td><a href="#" style="color:var(--primary-color);">View</a></td></tr>`
    )
    .join("");
}

// ==========================================
// 5. EVENT HANDLERS (GLOBAL & ACTIONS)
// ==========================================

// Global Search
if (globalSearchInput) {
  globalSearchInput.addEventListener("keyup", (e) => {
    const query = e.target.value.toLowerCase();
    if (currentViewName === "resources") {
      const filtered = globalResources.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query)
      );
      renderResources(filtered);
    } else if (currentViewName === "results") {
      const filtered = globalResults.filter((item) =>
        item.examName.toLowerCase().includes(query)
      );
      renderResults(filtered);
    }
  });
}

function updateSearchContext(view) {
  if (!globalSearchInput) return;
  globalSearchInput.value = "";
  if (view === "resources") {
    globalSearchInput.placeholder = "Search notes, PDFs...";
    globalSearchInput.disabled = false;
    globalSearchInput.parentElement.style.opacity = "1";
  } else if (view === "results") {
    globalSearchInput.placeholder = "Search exam names...";
    globalSearchInput.disabled = false;
    globalSearchInput.parentElement.style.opacity = "1";
  } else {
    globalSearchInput.placeholder = "Search unavailable here";
    globalSearchInput.disabled = true;
    globalSearchInput.parentElement.style.opacity = "0.5";
  }
}

// Global Window Functions (Called from HTML)
window.handleDownload = function (url, title) {
  if (url && url !== "#" && url !== "undefined") window.open(url, "_blank");
  else
    showModal(
      "Download",
      `Downloading <strong>${title}</strong>... (Demo)`,
      "alert"
    );
};

window.filterBySubject = function (subject, btnElement) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  btnElement.classList.add("active");
  if (subject === "All") renderResources(globalResources);
  else
    renderResources(globalResources.filter((item) => item.subject === subject));
};

window.enrollInCourse = function (id, title) {
  // OLD: showConfirmModal(...)
  // NEW: showModal(..., 'confirm', ...)
  showModal("Enroll", `Enroll in ${title}?`, "confirm", async (confirmed) => {
    if (confirmed) {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.uid, "enrolled_courses", id), {
          title: title,
          enrolledAt: new Date().toDateString(),
        });
        showToast("Success", "Enrolled Successfully!", "success");
        loadCoursesLogic(user.uid);
      }
    }
  });
};
// ==========================================
// 6. MAIN CONTROLLER (RENDER VIEW)
// ==========================================

window.renderView = async function (viewName, element = null) {
  const user = auth.currentUser;
  if (!user && viewName !== "dashboard") return;
  currentViewName = viewName;

  // Sidebar Active State Update
  if (element) {
    document
      .querySelectorAll(".side-menu li")
      .forEach((li) => li.classList.remove("active"));
    element.classList.add("active");
  }

  updateSearchContext(viewName);
  showContentLoader();

  // Render Logic
  setTimeout(() => {
    switch (viewName) {
      case "dashboard":
        pageTitle.innerText = "Dashboard Overview";
        contentArea.innerHTML = ViewDashboard(user);
        loadNotices();
        loadSchedule(true);
        updateDashboardStats(user);
        break;
      case "courses":
        pageTitle.innerText = "My Courses";
        contentArea.innerHTML = ViewCourses();
        loadCoursesLogic(user.uid);
        break;
      case "timetable":
        pageTitle.innerText = "Weekly Schedule";
        contentArea.innerHTML = ViewTimetable();
        loadSchedule(false);
        break;
      case "resources":
        pageTitle.innerText = "Study Resources";
        contentArea.innerHTML = ViewResources();
        loadResources();
        break;
      case "results":
        pageTitle.innerText = "Exam Results";
        contentArea.innerHTML = ViewResults();
        loadResults();
        break;
      case "settings":
        pageTitle.innerText = "Account Settings";
        contentArea.innerHTML = ViewSettings(user);
        attachSettingsListeners(); // Attach listeners AFTER html injection
        break;
      case "feedback":
        pageTitle.innerText = "Write a Review";
        contentArea.innerHTML = ViewFeedback(user);
        attachFeedbackListeners(user); // Attach listeners AFTER html injection
        break;
    }
  }, 400);
};

// ==========================================
// 7. SPECIFIC VIEW LISTENERS
// ==========================================

// Feedback Form Listener
function attachFeedbackListeners(user) {
  const form = document.getElementById("student-review-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const subtitle = document.getElementById("stu-sub").value;
      const rating = document.getElementById("stu-rating").value;
      const msg = document.getElementById("stu-msg").value;

      // NEW MODAL LOGIC
      showModal(
        "Submit Review",
        "Submit this review for approval?",
        "confirm",
        async (confirmed) => {
          if (confirmed) {
            try {
              let realName = user.displayName;
              if (!realName) {
                realName = user.email.split("@")[0];
                realName = realName.charAt(0).toUpperCase() + realName.slice(1);
              }

              await addDoc(collection(db, "reviews"), {
                name: realName,
                email: user.email,
                subtitle: subtitle,
                rating: parseInt(rating),
                message: msg,
                status: "pending",
                timestamp: serverTimestamp(),
              });
              showToast(
                "Success",
                "Review Submitted! Waiting for approval.",
                "success"
              );
              renderView("dashboard");
            } catch (err) {
              console.error(err);
              showToast("Error", "Could not submit review.", "error");
            }
          }
        }
      );
    });
  }
}
// Settings Page Listeners (Photo, Name, Password)
function attachSettingsListeners() {
  const CLOUD_NAME = "dx7ckwryz";
  const UPLOAD_PRESET = "EduSpark";

  // 1. PHOTO UPLOAD
  const fileInput = document.getElementById("file-upload");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      showModal(
        "Update Photo",
        "Change profile picture?",
        "confirm",
        async (confirmed) => {
          if (confirmed) {
            showToast("Uploading...", "Please wait a moment.", "success");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            try {
              const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                  method: "POST",
                  body: formData,
                }
              );
              const data = await res.json();
              if (data.secure_url) {
                const photoURL = data.secure_url;
                await updateProfile(auth.currentUser, { photoURL: photoURL });

                const settingsImg = document.getElementById(
                  "settings-avatar-img"
                );
                if (settingsImg) settingsImg.src = photoURL;
                const sidebarAvatar = document.getElementById("sidebarAvatar");
                if (sidebarAvatar)
                  sidebarAvatar.innerHTML = `<img src="${photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;

                showToast("Success", "Photo Updated! 📸", "success");
              } else throw new Error("Cloudinary Error");
            } catch (err) {
              console.error(err);
              showToast("Error", "Upload Failed.", "error");
            }
          }
        }
      );
    });
  }

  // 2. NAME UPDATE
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = document.getElementById("profile-btn");
      const name = document.getElementById("set-name").value;
      const originalText = btn.innerText;

      showModal(
        "Update Profile",
        "Are you sure you want to update your name?",
        "confirm",
        async (confirmed) => {
          if (confirmed) {
            btn.innerHTML = `<span class="spinner"></span> Updating...`;
            btn.disabled = true;
            try {
              await updateProfile(auth.currentUser, { displayName: name });
              showToast("Success", "Profile Updated!", "success");
              document.getElementById("sidebarName").innerText = name;
            } catch (e) {
              showToast("Error", e.message, "error");
            } finally {
              btn.innerHTML = originalText;
              btn.disabled = false;
            }
          }
        }
      );
    });
  }

  // 3. PASSWORD UPDATE
  const passForm = document.getElementById("pass-form");
  if (passForm) {
    passForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const oldPass = document.getElementById("old-pass").value;
      const newPass = document.getElementById("new-pass").value;
      const confirmPass = document.getElementById("confirm-pass").value;
      const btn = document.getElementById("pass-btn");
      const originalText = btn.innerText;

      if (newPass !== confirmPass) {
        showToast("Error", "New passwords do not match!", "error");
        return;
      }

      showModal(
        "Change Password",
        "You will be logged out after changing password.",
        "confirm",
        async (confirmed) => {
          if (confirmed) {
            btn.innerHTML = `<span class="spinner"></span> Verifying...`;
            btn.disabled = true;

            try {
              const user = auth.currentUser;
              const credential = EmailAuthProvider.credential(
                user.email,
                oldPass
              );
              await reauthenticateWithCredential(user, credential);
              await updatePassword(user, newPass);

              showToast(
                "Success",
                "Password Changed! Logging out...",
                "success"
              );
              passForm.reset();

              setTimeout(() => {
                signOut(auth).then(() => (window.location.href = "login.html"));
              }, 2000);
            } catch (err) {
              console.error(err);
              if (
                err.code === "auth/invalid-credential" ||
                err.code === "auth/wrong-password"
              ) {
                showToast("Error", "Incorrect Current Password.", "error");
              } else {
                showToast("Error", err.message, "error");
              }
              btn.innerHTML = originalText;
              btn.disabled = false;
            }
          }
        }
      );
    });
  }

  // 4. FORGOT PASSWORD
  const forgotBtn = document.getElementById("forgot-pass-btn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const user = auth.currentUser;

      showModal(
        "Reset Password",
        `Send reset link to <b>${user.email}</b>?`,
        "confirm",
        async (confirmed) => {
          if (confirmed) {
            try {
              await sendPasswordResetEmail(auth, user.email);
              showToast("Sent", "Check your email inbox! 📧", "success");
            } catch (err) {
              showToast("Error", err.message, "error");
            }
          }
        }
      );
    });
  }
} // ==========================================
// 8. NOTIFICATIONS & INITIALIZATION
// ==========================================

function setupRealtimeNotifications() {
  const badge = document.querySelector(".notif-btn .dot");

  // Memory Leak Fix: Detach old listener if exists
  if (unsubscribeNotifs) unsubscribeNotifs();

  let isInitial = true;

  unsubscribeNotifs = onSnapshot(
    collection(db, "notifications"),
    (snapshot) => {
      let unread = 0;
      snapshot.forEach((doc) => {
        if (!doc.data().read) unread++;
      });

      if (badge) {
        if (unread > 0) badge.classList.remove("hidden");
        else badge.classList.add("hidden");
      }

      if (!isInitial) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (!data.read) showToast("New Notification 🔔", data.title);
          }
        });
      }
      isInitial = false;
    }
  );
}

window.toggleNotifDropdown = async function () {
  const dropdown = document.getElementById("notif-dropdown");
  const list = document.getElementById("notif-list");
  dropdown.classList.toggle("hidden");

  if (!dropdown.classList.contains("hidden")) {
    list.innerHTML =
      "<p style='padding:10px; text-align:center;'>Loading...</p>";
    const snap = await getDocs(collection(db, "notifications"));
    let html = "";
    if (snap.empty) html = "<p style='padding:10px;'>No notifications.</p>";
    else {
      snap.forEach((doc) => {
        const d = doc.data();
        let t = d.timestamp ? timeAgo(d.timestamp.toDate()) : "Just now";
        html += `<div class="notif-item ${
          d.read ? "" : "unread"
        }" style="padding:10px; border-bottom:1px solid #eee;">
                        <h5 style="margin:0;">${
                          d.title
                        }</h5><p style="margin:2px 0; font-size:0.8rem; color:#666;">${
          d.message
        }</p><span style="font-size:0.7rem; color:#999;">${t}</span></div>`;
      });
    }
    list.innerHTML = html;
  }
};

async function updateDashboardStats(user) {
  try {
    const enrolledSnap = await getDocs(
      collection(db, "users", user.uid, "enrolled_courses")
    );
    const count = enrolledSnap.size;
    const statCourses = document.getElementById("stat-courses");
    if (statCourses) statCourses.innerText = count;
  } catch (e) {
    console.error(e);
  }

  try {
    const q = query(
      collection(db, "results"),
      where("studentEmail", "==", user.email.toLowerCase())
    );
    const snap = await getDocs(q);
    const testCount = snap.size;
    let bestRank = Infinity;
    snap.forEach((doc) => {
      const r = parseInt(doc.data().rank);
      if (!isNaN(r) && r < bestRank) bestRank = r;
    });
    const statTests = document.getElementById("stat-tests");
    const statRank = document.getElementById("stat-rank");
    if (statTests) statTests.innerText = testCount;
    if (statRank)
      statRank.innerText = bestRank === Infinity ? "NA" : `AIR ${bestRank}`;
  } catch (e) {
    console.error(e);
  }
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Sidebar update logic
    let displayName = user.displayName;
    if (!displayName) {
      displayName = user.email.split("@")[0];
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }

    document.getElementById("sidebarName").innerText = displayName;
    const avatarBox = document.getElementById("sidebarAvatar");

    if (user.photoURL) {
      avatarBox.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
      avatarBox.style.background = "transparent";
    } else {
      avatarBox.innerText = displayName.charAt(0).toUpperCase();
    }

    document.getElementById("current-date").innerText =
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

    // Initial render
    renderView("dashboard");
    setupRealtimeNotifications();
  } else {
    window.location.href = "login.html";
  }
});

// Logout Listener
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showModal(
      "Logout",
      "Are you sure you want to logout?",
      "confirm",
      (confirmed) => {
        if (confirmed) {
          if (unsubscribeNotifs) unsubscribeNotifs();
          signOut(auth).then(() => (window.location.href = "login.html"));
        }
      }
    );
  });
}
