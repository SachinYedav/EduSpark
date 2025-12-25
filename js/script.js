// 1. IMPORTS
import { auth, db, onAuthStateChanged } from "./firebase-config.js";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// GLOBAL UI UTILITIES (Modal & Toast)
// ==========================================

// 1. Inject HTML into DOM 
(function injectGlobalUI() {
  const uiHTML = `
        <div id="global-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="g-modal-title">Notification</h3>
                </div>
                <div class="modal-body">
                    <p id="g-modal-msg">Message goes here...</p>
                    <input type="text" id="g-modal-input" class="modal-input" placeholder="Enter details..." style="display:none;">
                </div>
                <div class="modal-footer">
                    <button id="g-modal-cancel" class="btn-modal btn-cancel" style="display:none;">Cancel</button>
                    <button id="g-modal-confirm" class="btn-modal btn-primary">Okay</button>
                </div>
            </div>
        </div>

        <div id="global-toast" class="toast-box">
            <i class="ri-notification-badge-line" style="font-size:1.5rem; color:#fff;"></i>
            <div class="toast-content">
                <h5 id="g-toast-title">Success</h5>
                <p id="g-toast-msg">Operation completed.</p>
            </div>
        </div>
    `;

  // Check if not already injected
  if (!document.getElementById('global-modal')) {
    document.body.insertAdjacentHTML('beforeend', uiHTML);
  }
})();

// 2. MODAL FUNCTION
window.showModal = function (title, message, type = 'alert', callback = null) {
  const modal = document.getElementById('global-modal');
  const titleEl = document.getElementById('g-modal-title');
  const msgEl = document.getElementById('g-modal-msg');
  const inputEl = document.getElementById('g-modal-input');
  const confirmBtn = document.getElementById('g-modal-confirm');
  const cancelBtn = document.getElementById('g-modal-cancel');

  // --- FIX IS HERE ---
  titleEl.innerText = title;
  msgEl.innerHTML = message; 
  // -------------------

  // Reset Elements 
  inputEl.style.display = 'none';
  cancelBtn.style.display = 'none';
  confirmBtn.innerText = "Okay";
  inputEl.value = "";
  confirmBtn.className = "btn-modal btn-primary"; 

  // Configure Type
  if (type === 'prompt') {
    inputEl.style.display = 'block';
    cancelBtn.style.display = 'inline-block';
    confirmBtn.innerText = "Submit";
  } else if (type === 'confirm') {
    cancelBtn.style.display = 'inline-block';
    confirmBtn.innerText = "Yes";
  } else if (type === 'danger') {
    cancelBtn.style.display = 'inline-block';
    confirmBtn.innerText = "Delete";
    confirmBtn.className = "btn-modal btn-danger";
  }

  // Show Modal
  modal.classList.remove('hidden');

  if (type === 'prompt') setTimeout(() => inputEl.focus(), 100);

  // Clone buttons to remove old listeners
  const newConfirm = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

  const newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  // Handle Confirm Click
  newConfirm.addEventListener('click', () => {
    const value = inputEl.value;
    if (type === 'prompt' && !value.trim()) {
      inputEl.style.border = "1px solid red"; 
      return;
    }
    modal.classList.add('hidden'); 
    if (callback) callback(type === 'prompt' ? value : true);
  });

  // Handle Cancel Click
  newCancel.addEventListener('click', () => {
    modal.classList.add('hidden'); 
    if (type === 'confirm' && callback) callback(false);
  });
};
// 3. TOAST FUNCTION
window.showToast = function (title, message, type = 'success') {
  const toast = document.getElementById('global-toast');
  document.getElementById('g-toast-title').innerText = title;
  document.getElementById('g-toast-msg').innerText = message;
  const icon = toast.querySelector('i');

  // Set Color based on type
  if (type === 'error') {
    toast.style.borderLeft = "5px solid #ef4444";
    icon.className = "ri-error-warning-line";
    icon.style.color = "#ef4444";
  } else {
    toast.style.borderLeft = "5px solid var(--primary-color)";
    icon.className = "ri-checkbox-circle-line";
    icon.style.color = "var(--primary-color)";
  }

  toast.classList.add('show');

  // Auto Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

// 4. INITIALIZATION
// Safe Mode AOS Init
if (typeof AOS !== "undefined") {
  AOS.init({ duration: 1000, once: false, offset: 100 });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initDemoVideo();
  loadReviews();
  checkAuthState();
});

// 5. FEATURE: NAVBAR SCROLL EFFECT
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }
}

// 6. FEATURE: WATCH DEMO VIDEO
async function initDemoVideo() {
  const watchBtn = document.getElementById("watchDemoBtn");
  const modal = document.getElementById("demoModal");
  const closeBtn = document.getElementById("closeVideoBtn");
  const iframe = document.getElementById("promoVideo");

  if (!watchBtn || !modal) return;

  let currentVideoId = "dQw4w9WgXcQ";

  // Fetch from Firebase
  try {
    const docSnap = await getDoc(doc(db, "site_config", "landing_page"));
    if (docSnap.exists() && docSnap.data().demoVideoId) {
      currentVideoId = docSnap.data().demoVideoId;
    }
  } catch (err) {
    console.warn("Using default video (Offline/Error).");
  }

  // Modal Logic
  watchBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("active"), 10);
    if (iframe)
      iframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1`;
  });

  const closeModal = () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.classList.add("hidden");
      if (iframe) iframe.src = "";
    }, 300);
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// 7. FEATURE: DYNAMIC REVIEWS
async function loadReviews() {
  const container = document.getElementById("reviews-marquee");
  if (!container) return;

  try {
    const q = query(
      collection(db, "reviews"),
      where("status", "==", "approved"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      renderFallbackReviews(container);
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const stars = "⭐".repeat(data.rating || 5);

      const safeMsg = data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeName = data.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      html += `
        <div class="review-card glass">
            <div class="stars">${stars}</div>
            <p>"${safeMsg}"</p>
            <h4>${safeName}, <span class="highlight">${data.subtitle || "Student"
        }</span></h4>
        </div>
      `;
    });

    container.innerHTML = html + html;
  } catch (e) {
    console.error("Reviews load error:", e);
    renderFallbackReviews(container);
  }
}

function renderFallbackReviews(container) {
  container.innerHTML = `
        <div class="review-card glass"><div class="stars">⭐⭐⭐⭐⭐</div><p>"The teachers here are amazing!"</p><h4>Rahul, <span class="highlight">IIT Delhi</span></h4></div>
        <div class="review-card glass"><div class="stars">⭐⭐⭐⭐⭐</div><p>"Best platform for JEE prep."</p><h4>Sneha, <span class="highlight">NIT Trichy</span></h4></div>
        <div class="review-card glass"><div class="stars">⭐⭐⭐⭐⭐</div><p>"Loved the video lectures!"</p><h4>Amit, <span class="highlight">Class 12</span></h4></div>
    `;
  container.innerHTML += container.innerHTML;
}

// 8. FEATURE: AUTH STATE
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    const desktopAuthBtn = document.getElementById("auth-btn");

    const mobileAuthBtn = document.getElementById("mobile-auth-btn");
    const mobileJoinContainer = document.getElementById(
      "mobile-join-container"
    );

    if (user) {
      if (desktopAuthBtn) {
        desktopAuthBtn.innerText = "Dashboard";
        desktopAuthBtn.href = "dashboard.html";
        desktopAuthBtn.classList.add("btn-primary");
        desktopAuthBtn.classList.remove("btn-secondary");
      }

      if (mobileAuthBtn) {
        mobileAuthBtn.innerText = "Dashboard";
        mobileAuthBtn.href = "dashboard.html";
        mobileAuthBtn.style.background = "var(--primary-color)";
        mobileAuthBtn.style.color = "#fff";
        mobileAuthBtn.style.border = "none";
      }

      if (mobileJoinContainer) {
        mobileJoinContainer.style.display = "none";
      }
    } else {
      // User LOGGED OUT (
      if (desktopAuthBtn) {
        desktopAuthBtn.innerText = "Login";
        desktopAuthBtn.href = "login.html";
        desktopAuthBtn.classList.add("btn-secondary");
        desktopAuthBtn.classList.remove("btn-primary");
      }

      if (mobileAuthBtn) {
        mobileAuthBtn.innerText = "Login";
        mobileAuthBtn.href = "login.html";
        mobileAuthBtn.style.background = "";
        mobileAuthBtn.style.color = "";
        mobileAuthBtn.style.border = "";
      }

      if (mobileJoinContainer) {
        mobileJoinContainer.style.display = "";
      }
    }
  });
}

// 9. UTILS: TOGGLE FORMS
window.toggleAuth = function () {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm && signupForm) {
    loginForm.classList.toggle("hidden");
    signupForm.classList.toggle("hidden");
  }
};

window.toggleAccordion = function (element) {
  const item = element.parentElement;
  item.classList.toggle("active");
};

// 10. HOMEPAGE NAVBAR TOGGLE
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("homeHamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");

      const icon = hamburger.querySelector("i");
      if (icon) {
        if (navLinks.classList.contains("active")) {
          icon.classList.remove("ri-menu-3-line");
          icon.classList.add("ri-close-line");
        } else {
          icon.classList.add("ri-menu-3-line");
          icon.classList.remove("ri-close-line");
        }
      }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");

        const icon = hamburger.querySelector("i");
        if (icon) {
          icon.classList.add("ri-menu-3-line");
          icon.classList.remove("ri-close-line");
        }
      });
    });
  } else {
    console.error("Error: Hamburger or NavLinks not found in HTML");
  }
});


// ==========================================
// 11. FEATURE: WHATSAPP CHAT BUTTON
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const waBtn = document.getElementById('whatsapp-btn');

  if (waBtn) {
    waBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // --- CONFIGURATION ---
      const phoneNumber = "911234567890"; //whatshapp number 
      const message = "Hello EduSpark Team! I have a query regarding your courses.";

      // Generate WhatsApp Link
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank');
    });
  }
});

// // ==========================================
// //  SECURITY: DISABLE INSPECT & RIGHT CLICK
// // ==========================================

// document.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
// });

// document.addEventListener('keydown', (e) => {
//     if (e.key === 'F12') {
//         e.preventDefault();
//         return false;
//     }

//     // Ctrl + Shift + I (Inspect)
//     if (e.ctrlKey && e.shiftKey && e.key === 'I') {
//         e.preventDefault();
//         return false;
//     }

//     // Ctrl + Shift + J (Console)
//     if (e.ctrlKey && e.shiftKey && e.key === 'J') {
//         e.preventDefault();
//         return false;
//     }

//     // Ctrl + U (View Source)
//     if (e.ctrlKey && e.key === 'U') {
//         e.preventDefault();
//         return false;
//     }
// });

// ==========================================
// MODERN PWA INSTALL POPUP
// ==========================================
let deferredPrompt;
let installShown = false;

const installCard = document.getElementById("pwa-install-card");
const installBtn = document.getElementById("pwa-install-btn");
const closeBtn = document.getElementById("pwa-close-btn");

const isIos = () =>
  /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Android / Desktop
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  if (!isInstalled() && !installShown) {
    installShown = true;
    setTimeout(() => installCard.classList.remove("hidden"), 4000);
  }
});

// Install click
installBtn?.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
  installCard.classList.add("hidden");
});

// Close
closeBtn?.addEventListener("click", () => {
  installCard.classList.add("hidden");
});

window.addEventListener("load", () => {
  if (isIos() && !isInstalled()) {
    setTimeout(() => {
      showModal(
        "Install EduSpark",
        "Tap Share → Add to Home Screen",
        "alert"
      );
    }, 5000);
  }
});

// Installed
window.addEventListener("appinstalled", () => {
  installCard?.classList.add("hidden");
});
