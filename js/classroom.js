// ==========================================
// 1. IMPORTS & CONFIGURATION
// ==========================================
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");

// DOM Elements
const player = document.getElementById("main-video-player");
const titleDisplay = document.getElementById("current-video-title");
const courseDisplay = document.getElementById("course-title-display");
const playlistContainer = document.getElementById("playlist-container");
const totalLessonsDisplay = document.getElementById("total-lessons");

// ==========================================
// 2. AUTH & ENROLLMENT VERIFICATION
// ==========================================
onAuthStateChanged(auth, async (user) => {
  // 1. Check Login Status
  if (!user) {
    showModal(
      "Authentication Required 🔒",
      "Please login to access the classroom.",
      "alert",
      () => {
        window.location.href = "login.html";
      }
    );
    return;
  }

  // 2. Check Course ID Validity
  if (!courseId) {
    showToast("Error", "No course selected.", "error");
    setTimeout(() => (window.location.href = "dashboard.html"), 2000);
    return;
  }

  // 3. Verify Enrollment
  try {
    const enrollmentRef = doc(
      db,
      "users",
      user.uid,
      "enrolled_courses",
      courseId
    );
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      console.log("User verified. Loading content...");
      loadCourseContent();
    } else {
      // User is logged in but NOT enrolled
      showModal(
        "Access Denied 🚫",
        "You have not enrolled in this course yet.",
        "alert",
        () => {
          window.location.href = `course-details.html?id=${courseId}`;
        }
      );
    }
  } catch (error) {
    console.error("Verification Error:", error);
    showToast("Error", "Could not verify enrollment.", "error");
    setTimeout(() => (window.location.href = "dashboard.html"), 2000);
  }
});

// ==========================================
// 3. LOAD CONTENT LOGIC
// ==========================================
async function loadCourseContent() {
  try {
    const docRef = doc(db, "courses", courseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // UI Update
      if (courseDisplay) courseDisplay.innerText = data.title;
      if (totalLessonsDisplay) {
        const count = data.syllabus ? data.syllabus.length : 0;
        totalLessonsDisplay.innerText = `${count} Lessons`;
      }

      // Render Playlist
      renderPlaylist(data.syllabus || []);
    } else {
      showModal(
        "Not Found ❌",
        "This course does not exist or was deleted.",
        "alert",
        () => {
          window.location.href = "dashboard.html";
        }
      );
    }
  } catch (error) {
    console.error("Error loading course:", error);
    showToast("Error", "Failed to load course content.", "error");
  }
}

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// YouTube ID Extractor
function getYouTubeID(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Render Playlist Function
function renderPlaylist(syllabus) {
  playlistContainer.innerHTML = "";

  if (!syllabus || syllabus.length === 0) {
    playlistContainer.innerHTML = `
            <div style="padding:20px; text-align:center; color:#94a3b8;">
                <i class="ri-folder-open-line" style="font-size: 2rem;"></i>
                <p>No lessons uploaded yet.</p>
            </div>`;
    return;
  }

  let firstVideoId = null;
  let firstTitle = "";

  syllabus.forEach((lesson, index) => {
    let lessonName = "";
    let videoUrl = "";

    // Handle Object vs String Data Structure
    if (typeof lesson === "object" && lesson !== null) {
      lessonName = lesson.title || `Lesson ${index + 1}`;
      videoUrl = lesson.videoUrl || "";
    } else {
      lessonName = lesson;
      videoUrl = "";
    }

    const videoId = getYouTubeID(videoUrl);

    // Capture first valid video for Autoplay
    if (index === 0) {
      firstVideoId = videoId;
      firstTitle = lessonName;
    }

    // Create DOM Element
    const item = document.createElement("div");
    item.className = `lesson-item ${index === 0 ? "active" : ""}`;

    const iconClass = videoId ? "ri-play-circle-line" : "ri-lock-line";
    const statusText = videoId ? "Watch Now" : "Coming Soon";
    const statusColor = videoId ? "#6366f1" : "#94a3b8";

    item.innerHTML = `
            <i class="${iconClass}" style="color:${statusColor}; font-size:1.2rem;"></i>
            <div class="lesson-info">
                <h4 style="margin:0; font-size:0.95rem;">${lessonName}</h4>
                <span style="font-size: 0.75rem; color:${statusColor};">${statusText}</span>
            </div>
        `;

    // Click Event Listener
    item.addEventListener("click", () => {
      if (videoId) {
        // Remove Active Class from all
        document
          .querySelectorAll(".lesson-item")
          .forEach((el) => el.classList.remove("active"));
        item.classList.add("active");

        // Play Video
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        titleDisplay.innerText = lessonName;

        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showToast("Locked 🔒", "This lesson is not available yet.", "error");
      }
    });

    playlistContainer.appendChild(item);
  });

  // Auto Load First Video
  if (firstVideoId && player) {
    player.src = `https://www.youtube.com/embed/${firstVideoId}`;
    if (titleDisplay) titleDisplay.innerText = firstTitle;
  }
}
