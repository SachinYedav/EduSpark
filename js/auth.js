import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "./firebase-config.js";

// ==========================================
// 1. SIGNUP FUNCTION
// ==========================================
const signupBtn = document.getElementById("signupBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPass").value;
    const name = document.getElementById("signupName").value;

    // 1. Validation Check
    if (!email || !password || !name) {
      showModal(
        "Missing Info ⚠️",
        "Please fill in all details (Name, Email, Password).",
        "alert"
      );
      return;
    }

    signupBtn.innerText = "Creating...";

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User Created:", userCredential.user);

        // 2. Success Modal with Redirect Callback
        showModal(
          "Success! 🎉",
          `Account Created! Welcome, ${name}. Redirecting...`,
          "alert",
          () => {
            window.location.href = "dashboard.html";
          }
        );
      })
      .catch((error) => {
        console.error("Signup Error:", error);

        // 3. User-Friendly Error Handling
        let msg = error.message;
        if (error.code === "auth/email-already-in-use")
          msg = "This email is already registered.";
        if (error.code === "auth/weak-password")
          msg = "Password should be at least 6 characters.";

        showModal("Signup Failed ❌", msg, "alert");
        signupBtn.innerText = "Create Account";
      });
  });
}

// ==========================================
// 2. LOGIN FUNCTION
// ==========================================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;

    // 1. Validation
    if (!email || !password) {
      showModal(
        "Inputs Empty ⚠️",
        "Please enter both email and password!",
        "alert"
      );
      return;
    }

    loginBtn.innerText = "Logging in...";

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // 2. Success Modal
        showModal(
          "Welcome Back! 👋",
          "Login Successful! Taking you to dashboard...",
          "alert",
          () => {
            window.location.href = "dashboard.html";
          }
        );
      })
      .catch((error) => {
        console.error("Login Error:", error);

        // 3. Friendly Error Handling
        let msg = "Invalid Email or Password.";
        if (error.code === "auth/user-not-found")
          msg = "No account found with this email.";
        if (error.code === "auth/wrong-password")
          msg = "Incorrect password. Please try again.";
        if (error.code === "auth/too-many-requests")
          msg = "Too many failed attempts. Please try again later.";

        showModal("Login Failed ❌", msg, "alert");
        loginBtn.innerText = "Login Now";
      });
  });
}

// ==========================================
// 3. FORGOT PASSWORD FUNCTION (Using Custom Prompt)
// ==========================================
const forgotBtn = document.getElementById("forgotBtn");

if (forgotBtn) {
  forgotBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 1. Show Custom Prompt Modal
    showModal(
      "Reset Password 🔒",
      "Please enter your registered Email address:",
      "prompt",
      (email) => {
        if (email) {
          sendPasswordResetEmail(auth, email)
            .then(() => {
              showModal(
                "Email Sent 📧",
                "Password reset link has been sent to your inbox.",
                "alert"
              );
            })
            .catch((error) => {
              console.error("Reset Error:", error);
              let msg = error.message;
              if (error.code === "auth/user-not-found")
                msg = "This email is not registered with us.";

              showModal("Error ⚠️", msg, "alert");
            });
        }
      }
    );
  });
}
