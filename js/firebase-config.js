// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase (สัปดาห์ที่ 6)
// โหลด SDK จาก CDN แบบ ES module เพราะโปรเจกต์นี้ไม่มีขั้นตอน build
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8QOQ2nGWT4KO64Y7S3_pQ-Nbi7UzKb78",
  authDomain: "leaveeasy-3e8db.firebaseapp.com",
  projectId: "leaveeasy-3e8db",
  storageBucket: "leaveeasy-3e8db.firebasestorage.app",
  messagingSenderId: "965291195275",
  appId: "1:965291195275:web:7b0c3bb0eff9a2b814cd8e",
  measurementId: "G-NG75FJ5WMQ"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
