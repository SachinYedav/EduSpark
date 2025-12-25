<div align="center">
  <img src="images/web-app-manifest-512x512.png" alt="EduSpark Logo" width="120" />

  <h1>🚀 EduSpark</h1>

  <h3>The Future of Learning</h3>

  <p>
    <strong>A Premium Progressive Web App (PWA) for Modern Education</strong><br/>
    Fast • Secure • Offline‑Ready • Mobile‑First
  </p>

  <p>
    <a href="https://edusparks.netlify.app/">🌐 Live Demo</a> •
    <a href="https://github.com/yourusername/eduspark/issues">🐞 Report Bug</a> •
    <a href="https://github.com/yourusername/eduspark/pulls">✨ Request Feature</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />
    <img src="https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Mobile--First-Yes-success?style=flat-square" />
    <img src="https://img.shields.io/badge/Offline-Supported-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/Framework-Vanilla%20JS-yellow?style=flat-square" />
  </p>
</div>

---

## 📖 About EduSpark

**EduSpark** is a next-generation **Learning Management System (LMS)** designed to bridge the gap between students and quality education.
It is a **Progressive Web App (PWA)** with a "Mobile-First" approach, offline support, installable experience, and fast performance on Android, iOS, and desktop browsers.

> 🎯 **Goal:** Empower students and institutes with modern digital learning tools without complexity.

---

## ✨ Key Features

### 👨‍🎓 For Students

* **📱 Installable PWA:** Add to Home Screen on Android & iOS.
* **🔐 Secure Auth:** Login/Signup via Google & Email (Firebase).
* **📊 Dashboard:** Track enrolled courses, announcements, and progress.
* **📡 Offline Support:** Access content even with unstable internet.
* **📺 Classroom Mode:** Distraction-free video player.

### 👨‍🏫 For Admins

* **🎛️ Admin Panel:** Add/Edit/Delete courses in real-time.
* **☁️ Cloud Integration:** Upload thumbnails via Cloudinary.
* **🔥 Realtime Database:** Updates using Firebase Firestore.
* **👥 User Management:** Manage student enrollments easily.

---

## 🛠️ Tech Stack

| Category           | Technology                               |
| :----------------- | :--------------------------------------- |
| **Frontend**       | HTML5, CSS3, JavaScript (ES6+)           |
| **Styling**        | Custom CSS Variables, Responsive Layouts |
| **Database**       | Firebase Firestore (Realtime NoSQL)      |
| **Authentication** | Firebase Auth (Google / Email)           |
| **Media Storage**  | Cloudinary (Optimized Images)            |
| **PWA Core**       | Service Worker, Manifest.json, Cache API |
| **Animations**     | AOS (Animate on Scroll)                  |

---

## 📂 Project Structure

```text
EDUSPARK/
│
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── script.js
│   └── dashboard.js
├── images/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   └── web-app-manifest-512x512.png
├── index.html
├── dashboard.html
├── login.html
├── offline.html
├── manifest.json
└── sw.js
```

---

## 🚀 Getting Started

### Prerequisites

* VS Code or any code editor
* Firebase project (free tier)
* Cloudinary account (free tier)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/SachinYedav/eduspark.git
cd eduspark
```

2. Configure Firebase:

Update `js/firebase-config.js` with your Firebase credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};
```

3. Run locally:

Open `index.html` using Live Server in VS Code or any local server.

---

## 📱 PWA Installation Guide

### Android

1. Open website in Chrome.
2. Wait for the **Install App** prompt.
3. Click **Install** to add EduSpark to your app drawer.

### iOS

1. Open website in Safari.
2. Tap the **Share** button.
3. Select **"Add to Home Screen"**.
4. The app appears with EduSpark icon.

---

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact

**EduSpark Team** – Email: [frontenddeveloper1913@gmail.com](mailto:your@email.com)
🔗 GitHub: [https://github.com/SachinYedav/eduspark](https://github.com/yourusername/eduspark)
🔗 Live Site: [https://edusparks.netlify.app](https://edusparks.netlify.app)

---

<p align="center">
Made with ❤️ and ☕ using modern web standards and PWA best practices
</p>
