// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: ล็อกอินด้วยอีเมล/รหัสผ่านของ Firebase Authentication
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้อีก
onAuthStateChanged(auth, function (user) {
  if (user) location.href = "leave-requests.html";
});

var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;

  if (!อีเมล || !รหัสผ่าน) {
    เตือน("กรอกอีเมลและรหัสผ่านก่อน จึงจะเข้าสู่ระบบได้");
    return;
  }

  กล่องเตือน.classList.add("hidden");
  ปุ่มเข้าสู่ระบบ.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    location.href = "leave-requests.html";
  } catch (err) {
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่มเข้าสู่ระบบ.disabled = false;
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(err) {
  if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  return "เข้าสู่ระบบไม่สำเร็จ: " + err.message;
}
