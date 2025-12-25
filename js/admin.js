import { auth, db, signOut, onAuthStateChanged } from "./firebase-config.js";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION  ---
const CLOUD_NAME = "dx7ckwryz";
const UPLOAD_PRESET = "EduSpark";

const ALLOWED_ADMINS = [
  "frontenddeveloper1913@gmail.com",
  "ankitsantoriya3@gmail.com",
];

const ADMIN_SECRET_PIN = "HyperDev@5";

// --- AUTH & SECURITY CHECK ---
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    if (!ALLOWED_ADMINS.includes(user.email.toLowerCase())) {
      alert("⚠️ ACCESS DENIED: You are not an Admin!");
      window.location.href = "dashboard.html";
      return;
    }

    // 3. SECRET PIN CHECK
    const sessionKey = sessionStorage.getItem("admin_access_token");

    if (sessionKey !== "GRANTED") {
      const userPin = prompt("🔒 Enter Admin Access PIN:");

      if (userPin === ADMIN_SECRET_PIN) {
        sessionStorage.setItem("admin_access_token", "GRANTED");
        alert("Welcome, Admin! 🛡️");

        loadAllData();

        const dateField = document.getElementById("notice-date");
        if (dateField)
          dateField.value = new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
      } else {
        alert("❌ Wrong PIN! Security Alert.");
        window.location.href = "dashboard.html";
      }
    } else {
      loadAllData();
    }
  }
});

// 1. NOTICES HANDLER
const noticeForm = document.getElementById("notice-form");
if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("notices", {
      title: document.getElementById("notice-title").value,
      message: document.getElementById("notice-msg").value,
      type: document.getElementById("notice-type").value,
      date: document.getElementById("notice-date").value,
      timestamp: serverTimestamp(),
    });
    noticeForm.reset();
    document.getElementById("notice-date").value =
      new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  });
}

// 2. SCHEDULE HANDLER
const schForm = document.getElementById("schedule-form");
if (schForm) {
  schForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("schedule", {
      subject: document.getElementById("sch-subject").value,
      teacher: document.getElementById("sch-teacher").value,
      time: document.getElementById("sch-time").value,
      day: document.getElementById("sch-day").value,
      status: document.getElementById("sch-status").value,
    });
    schForm.reset();
  });
}

// 3. RESOURCES HANDLER
const resForm = document.getElementById("resource-form");
if (resForm) {
  resForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("resources", {
      title: document.getElementById("res-title").value,
      subject: document.getElementById("res-subject").value,
      type: document.getElementById("res-type").value,
      link: document.getElementById("res-link").value,
    });
    resForm.reset();
  });
}

// 4. RESULTS HANDLER
const resultForm = document.getElementById("result-form");
if (resultForm) {
  resultForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("results", {
      examName: document.getElementById("exam-name").value,
      studentEmail: document
        .getElementById("exam-student-email")
        .value.toLowerCase(),
      date: document.getElementById("exam-date").value,
      score: document.getElementById("exam-score").value,
      rank: document.getElementById("exam-rank").value,
      status: document.getElementById("exam-status").value,
    });
    resultForm.reset();
  });
}

// 5. BELL NOTIFICATIONS
const notifForm = document.getElementById("notif-form");
if (notifForm) {
  notifForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("notifications", {
      title: document.getElementById("notif-title").value,
      message: document.getElementById("notif-msg").value,
      read: false,
      timestamp: serverTimestamp(),
    });
    notifForm.reset();
  });
}

// 6. COURSES LOGIC

// --- A. SYLLABUS "ADD MORE" & "REMOVE" LOGIC ---
const syllabusWrapper = document.getElementById("syllabus-wrapper");
const addChapterBtn = document.getElementById("add-chapter-btn");

if (addChapterBtn && syllabusWrapper) {
  addChapterBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("syllabus-row");
    div.style.cssText =
      "display: grid; grid-template-columns: 1.5fr 1.5fr 0.2fr; gap: 10px; margin-bottom: 10px;";
    div.innerHTML = `
            <input type="text" class="chapter-title" placeholder="Chapter Name" required>
            <input type="url" class="chapter-link" placeholder="YouTube Video URL">
            <button type="button" class="remove-row-btn" style="background: #fee2e2; color: #ef4444; border: none; border-radius: 5px; cursor: pointer;">
                <i class="ri-delete-bin-line"></i>
            </button>
        `;
    syllabusWrapper.appendChild(div);
  });

  syllabusWrapper.addEventListener("click", (e) => {
    if (e.target.closest(".remove-row-btn")) {
      const rows = document.querySelectorAll(".syllabus-row");
      if (rows.length > 1) {
        e.target.closest(".syllabus-row").remove();
      } else {
        alert("At least one chapter is required!");
      }
    }
  });
}

// --- B. CLOUDINARY IMAGE UPLOAD LOGIC ---
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("image-file");
const statusText = document.getElementById("upload-status");
const imgPreview = document.getElementById("img-preview");
const finalUrlInput = document.getElementById("final-image-url");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Select an image first!");
      return;
    }

    statusText.innerText = "Uploading to Cloudinary...";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        statusText.innerText = "Upload Complete! ✅";
        finalUrlInput.value = data.secure_url;
        imgPreview.src = data.secure_url;
        imgPreview.style.display = "block";
      } else {
        statusText.innerText = "Upload Failed";
        console.error(data);
      }
    } catch (err) {
      console.error(err);
      statusText.innerText = "Error Uploading.";
    }
  });
}

// --- C. FINAL COURSE FORM SUBMIT ---
const courseForm = document.getElementById("course-form");

if (courseForm) {
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const imageUrl = document.getElementById("final-image-url").value;
    if (!imageUrl) {
      alert("Please upload the Course Image first!");
      return;
    }

    const syllabusRows = document.querySelectorAll(".syllabus-row");
    const syllabusArray = [];

    syllabusRows.forEach((row) => {
      const title = row.querySelector(".chapter-title").value;
      const link = row.querySelector(".chapter-link").value;

      if (title.trim() !== "") {
        syllabusArray.push({
          title: title.trim(),
          videoUrl: link.trim() || "",
        });
      }
    });

    const courseData = {
      title: document.getElementById("course-title").value,
      category: document.getElementById("course-cat").value,
      badge: document.getElementById("course-badge").value,
      rating: document.getElementById("course-rating").value,
      price: document.getElementById("course-price").value,
      originalPrice: document.getElementById("course-original-price").value,
      language: document.getElementById("course-lang").value,
      duration: document.getElementById("course-duration").value,
      shortDescription: document.getElementById("course-short-desc").value,
      fullDescription: document.getElementById("course-desc").value,
      image: imageUrl,
      syllabus: syllabusArray,
      timestamp: serverTimestamp(),
    };

    await addToDB("courses", courseData);

    courseForm.reset();
    imgPreview.style.display = "none";
    statusText.innerText = "";
    document.getElementById("final-image-url").value = "";

    if (syllabusWrapper) {
      syllabusWrapper.innerHTML = `
                <div class="syllabus-row" style="display: grid; grid-template-columns: 1.5fr 1.5fr 0.2fr; gap: 10px; margin-bottom: 10px;">
                    <input type="text" class="chapter-title" placeholder="Chapter Name" required>
                    <input type="url" class="chapter-link" placeholder="YouTube Video URL">
                    <button type="button" class="remove-row-btn" style="background: #fee2e2; color: #ef4444; border: none; border-radius: 5px; cursor: pointer;"><i class="ri-delete-bin-line"></i></button>
                </div>`;
    }
  });
}

// 7. REVIEWS FORM
const reviewForm = document.getElementById("review-form");
if (reviewForm) {
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addToDB("reviews", {
      name: document.getElementById("rev-name").value,
      subtitle: document.getElementById("rev-sub").value,
      rating: parseInt(document.getElementById("rev-rating").value),
      message: document.getElementById("rev-msg").value,
      status: "approved",
      timestamp: serverTimestamp(),
    });
    reviewForm.reset();
  });
}

// UNIVERSAL HELPERS
async function addToDB(collName, data) {
  try {
    await addDoc(collection(db, collName), data);
    showToast("Success", "Item Added Successfully! 🚀");
  } catch (e) {
    alert("Error: " + e.message);
    console.error(e);
  }
}

// Generic Delete for other sections
window.deleteItem = async function (collName, id) {
  if (confirm("Delete this item permanently?")) {
    try {
      await deleteDoc(doc(db, collName, id));
      showToast("Deleted", "Item removed.");
    } catch (e) {
      alert("Error: " + e.message);
    }
  }
};

function loadAllData() {
  // 1. Notices
  onSnapshot(
    query(collection(db, "notices"), orderBy("timestamp", "desc")),
    (snap) => {
      renderList(
        "notices-list-container",
        snap,
        "notices",
        (d) => `<h4>${d.title}</h4><p>${d.date} • ${d.type.toUpperCase()}</p>`
      );
    }
  );

  // 2. Schedule
  onSnapshot(collection(db, "schedule"), (snap) => {
    renderList(
      "schedule-list-container",
      snap,
      "schedule",
      (d) => `<h4>${d.subject} (${d.day})</h4><p>${d.time} • ${d.teacher}</p>`
    );
  });

  // 3. Resources
  onSnapshot(collection(db, "resources"), (snap) => {
    renderList(
      "resource-list-container",
      snap,
      "resources",
      (d) => `<h4>${d.title}</h4><p>${d.subject} • ${d.type}</p>`
    );
  });

  // 4. Results
  onSnapshot(collection(db, "results"), (snap) => {
    renderList(
      "result-list-container",
      snap,
      "results",
      (d) => `<h4>${d.examName}</h4><p>Score: ${d.score} • Rank: ${d.rank}</p>`
    );
  });

  // 5. Notifications
  onSnapshot(
    query(collection(db, "notifications"), orderBy("timestamp", "desc")),
    (snap) => {
      renderList(
        "notif-list-container",
        snap,
        "notifications",
        (d) => `<h4>${d.title}</h4><p>${d.message}</p>`
      );
    }
  );

  // 6. COURSES
  onSnapshot(collection(db, "courses"), (snap) => {
    renderList(
      "course-list-container",
      snap,
      "courses",
      (data) => `
            <div class="item-info">
                <h4>${data.title}</h4>
                <p>
                    <span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.8rem;">${
                      data.category
                    }</span> 
                    • ⭐ ${data.rating} • ${
        data.syllabus ? data.syllabus.length : 0
      } Chapters
                </p>
            </div>
        `
    );
  });

  // 7. REVIEWS  PENDING vs APPROVED
  onSnapshot(
    query(collection(db, "reviews"), orderBy("timestamp", "desc")),
    (snapshot) => {
      const pendingContainer = document.getElementById("pendingList");
      const approvedContainer = document.getElementById("approvedList");

      if (pendingContainer && approvedContainer) {
        pendingContainer.innerHTML = "";
        approvedContainer.innerHTML = "";

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const id = docSnap.id;

          const safeMsg = data.message
            ? data.message.replace(/'/g, "\\'").replace(/"/g, "&quot;")
            : "";
          const safeName = data.name ? data.name.replace(/'/g, "\\'") : "";
          const safeSub = data.subtitle
            ? data.subtitle.replace(/'/g, "\\'")
            : "";

          const itemHTML = `
                    <div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div style="width:100%">
                            <strong>${
                              data.name
                            }</strong> <span style="font-size:0.8rem; color:#666;">(${
            data.rating
          }⭐)</span>
                            <p style="margin: 5px 0; font-size: 0.85rem; color: #334155;">${
                              data.message ? data.message.substring(0, 50) : ""
                            }...</p>
                        </div>
                        <div style="display: flex; gap: 5px; width: 100%;">
                            
                            <button onclick="viewReview('${id}', '${safeName}', '${safeSub}', '${
            data.rating
          }', '${safeMsg}')" 
                                class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;">
                                <i class="ri-eye-line"></i> View
                            </button>

                            ${
                              data.status !== "approved"
                                ? `
                            <button onclick="approveReview('${id}')" 
                                class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #16a34a;">
                                <i class="ri-check-line"></i> Approve
                            </button>`
                                : ""
                            }

                            <button onclick="deleteReview('${id}')" 
                                class="btn-delete" style="padding: 5px 10px; font-size: 0.8rem;">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                `;

          if (data.status === "approved") {
            approvedContainer.innerHTML += itemHTML;
          } else {
            pendingContainer.innerHTML += itemHTML;
          }
        });

        if (pendingContainer.innerHTML === "")
          pendingContainer.innerHTML =
            '<p style="padding:10px; text-align:center; color:#94a3b8;">No pending reviews.</p>';
        if (approvedContainer.innerHTML === "")
          approvedContainer.innerHTML =
            '<p style="padding:10px; text-align:center; color:#94a3b8;">No approved reviews.</p>';
      }
    }
  );
}

function renderList(containerId, snapshot, collName, templateFn) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML =
        "<p style='padding:10px; text-align:center; color:#94a3b8;'>No items found.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      container.innerHTML += `
                <div class="list-item">
                    <div class="item-details">${templateFn(data)}</div>
                    <button class="btn-delete" onclick="deleteItem('${collName}', '${
        doc.id
      }')"><i class="ri-delete-bin-line"></i></button>
                </div>`;
    });
  }
}

function showToast(title, msg) {
  const toast = document.getElementById("live-toast");
  if (toast) {
    document.getElementById("toast-title").innerText = title;
    document.getElementById("toast-message").innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => (window.location.href = "login.html"));
  });
}

// 8. REVIEW FUNCTIONS (View, Approve, Smart Delete)
window.viewReview = (id, name, sub, rating, msg) => {
  const idField = document.getElementById("currentReviewId");
  if (idField) idField.value = id;

  const nameField = document.getElementById("rev-name");
  if (nameField) nameField.value = name;

  const subField = document.getElementById("rev-sub");
  if (subField) subField.value = sub;

  const ratingField = document.getElementById("rev-rating");
  if (ratingField) ratingField.value = rating;

  const msgField = document.getElementById("rev-msg");
  if (msgField) msgField.value = msg;

  if (nameField)
    nameField.scrollIntoView({ behavior: "smooth", block: "center" });
};

window.clearEditor = () => {
  const fields = [
    "currentReviewId",
    "rev-name",
    "rev-sub",
    "rev-rating",
    "rev-msg",
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
};

window.approveReview = async (id) => {
  try {
    await updateDoc(doc(db, "reviews", id), { status: "approved" });
    showToast("Approved", "Review is now Live! ✅");
  } catch (error) {
    console.error("Error approving:", error);
    alert("Error: " + error.message);
  }
};

window.deleteReview = async (id) => {
  if (!confirm("Are you sure you want to delete this review?")) return;

  try {
    await deleteDoc(doc(db, "reviews", id));

    const currentIdField = document.getElementById("currentReviewId");
    if (currentIdField && currentIdField.value === id) {
      window.clearEditor();
    }
    showToast("Deleted", "Review removed.");
  } catch (error) {
    console.error("Error deleting:", error);
    alert("Delete failed: " + error.message);
  }
};

// 9. MANAGE DEMO VIDEO
const videoBtn = document.getElementById("update-video-btn");

if (videoBtn) {
  videoBtn.addEventListener("click", async () => {
    const urlInput = document.getElementById("admin-video-url").value;

    if (!urlInput) {
      alert("Please enter a YouTube link!");
      return;
    }

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlInput.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;

    if (!videoId) {
      alert("Invalid YouTube Link! Please check.");
      return;
    }

    // 2. Save to Firebase
    try {
      await setDoc(
        doc(db, "site_config", "landing_page"),
        {
          demoVideoId: videoId,
        },
        { merge: true }
      );

      showToast("Success", "Video Updated Successfully! 🎥");
      document.getElementById("admin-video-url").value = "";
    } catch (error) {
      console.error(error);
      alert("Error updating video: " + error.message);
    }
  });
}
