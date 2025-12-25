// ==========================================
// 1. UNIFIED IMPORTS
// ==========================================
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global Variables
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");
let currentCourseData = null;

// ==========================================
// 2. LOAD COURSE DETAILS LOGIC
// ==========================================
async function loadCourseDetails() {
  // 1. Check if ID exists
  if (!courseId) {
    showModal("Error ⚠️", "No course selected!", "alert", () => {
      window.location.href = "index.html";
    });
    return;
  }

  try {
    // Show Loading State
    const docRef = doc(db, "courses", courseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      currentCourseData = data;
      console.log("Course Data Loaded");

      // --- A. UI UPDATES ---
      const titleEl = document.getElementById("course-title");
      if (titleEl) titleEl.innerText = data.title || "No Title";

      const catEl = document.getElementById("course-category");
      if (catEl) catEl.innerText = data.category || "General";

      // Description Handling
      const tagLine = data.shortDescription || data.description || "";
      const descEl = document.getElementById("course-desc");
      if (descEl) descEl.innerText = tagLine;

      // Pricing
      const priceEl = document.getElementById("course-price");
      if (priceEl) priceEl.innerText = "₹" + data.price;

      if (data.originalPrice) {
        const orgPriceEl = document.getElementById("course-original-price");
        if (orgPriceEl) orgPriceEl.innerText = "₹" + data.originalPrice;
      }

      // Full Description
      const fullDescEl = document.getElementById("course-full-desc");
      if (fullDescEl) {
        fullDescEl.innerText =
          data.fullDescription ||
          data.description ||
          "No detailed description available.";
      }

      // Image Preview
      const bgDiv = document.getElementById("course-bg-gradient");
      if (bgDiv && data.image) {
        bgDiv.className = "video-preview";
        if (data.image.startsWith("http")) {
          bgDiv.style.backgroundImage = `url('${data.image}')`;
          bgDiv.style.backgroundSize = "cover";
          bgDiv.style.backgroundPosition = "center";
        } else {
          bgDiv.classList.add(data.image);
        }
      }

      // --- B. SYLLABUS RENDER ---
      renderSyllabus(data.syllabus);

      // Hide Loader & Show Content
      const spinner = document.getElementById("loading-spinner");
      const content = document.getElementById("course-main-content");
      if (spinner) spinner.style.display = "none";
      if (content) content.style.display = "block";
    } else {
      showModal("Not Found ❌", "This course does not exist.", "alert", () => {
        window.location.href = "index.html";
      });
    }
  } catch (error) {
    console.error("Error getting document:", error);
    showToast("Error", "Failed to load course details.", "error");
  }
}

// Helper: Render Syllabus
function renderSyllabus(syllabus) {
  const syllabusContainer = document.getElementById("syllabus-container");
  if (!syllabusContainer) return;

  syllabusContainer.innerHTML = "";

  if (syllabus && Array.isArray(syllabus) && syllabus.length > 0) {
    syllabus.forEach((lesson, index) => {
      let lessonTitle = `Lesson ${index + 1}`;

      // Handle Object vs String
      if (typeof lesson === "object" && lesson !== null) {
        lessonTitle = lesson.title || lessonTitle;
      } else {
        lessonTitle = lesson;
      }

      const item = `
                <div class="accordion-item" style="margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div class="accordion-header" style="background:#fff; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:#334155;">
                            ${index + 1}. ${lessonTitle}
                        </span>
                        <i class="ri-lock-line" style="color: #94a3b8;"></i>
                    </div>
                </div>
            `;
      syllabusContainer.innerHTML += item;
    });
  } else {
    syllabusContainer.innerHTML =
      "<p style='padding:10px; color:#64748b; text-align:center;'>Syllabus will be updated soon.</p>";
  }
}

// Function Call
loadCourseDetails();

// ==========================================
// 3. ENROLL BUTTON LOGIC
// ==========================================
const enrollBtn = document.getElementById("enroll-btn");

if (enrollBtn) {
  enrollBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    // 1. Auth Check
    if (!user) {
      showModal(
        "Login Required 🔒",
        "Please login to enroll in this course.",
        "alert",
        () => {
          window.location.href = "login.html";
        }
      );
      return;
    }

    // 2. Confirmation Step
    showModal(
      "Confirm Enrollment",
      `Do you want to enroll in <b>${
        currentCourseData ? currentCourseData.title : "this course"
      }</b>?`,
      "confirm",
      async (confirmed) => {
        if (confirmed) {
          // 3. Disable Button
          const originalText = enrollBtn.innerText;
          enrollBtn.innerText = "Enrolling...";
          enrollBtn.disabled = true;

          try {
            const enrollmentRef = doc(
              db,
              "users",
              user.uid,
              "enrolled_courses",
              courseId
            );

            await setDoc(enrollmentRef, {
              title: currentCourseData ? currentCourseData.title : "New Course",
              enrolledAt: new Date().toISOString(), // String format for UI
              timestamp: serverTimestamp(), // Firebase Server Timestamp for sorting
              courseId: courseId,
              progress: 0,
            });

            // 4. Success Response
            showModal(
              "Success 🎉",
              "You have successfully enrolled! Redirecting to Dashboard...",
              "alert",
              () => {
                window.location.href = "dashboard.html";
              }
            );
          } catch (error) {
            console.error("Enrollment Error:", error);
            showToast("Error", "Enrollment failed. Please try again.", "error");

            // Reset Button
            enrollBtn.innerText = originalText;
            enrollBtn.disabled = false;
          }
        }
      }
    );
  });
}
