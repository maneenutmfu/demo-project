// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — ด่านตรวจล็อกอิน ใช้ร่วมกันทุกหน้า
// สัปดาห์ที่ 7: ยังไม่ได้ล็อกอิน ให้เด้งไปหน้าล็อกอิน
// ⚠️ กันแค่ฝั่งหน้าจอ (UX) ตัวป้องกันข้อมูลจริงอยู่ที่ firestore.rules
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var ตัวสัญญาผู้ใช้ = new Promise(function (resolve) {
  onAuthStateChanged(auth, function (user) {
    if (!user) {
      location.href = "login.html";
      return;
    }
    แสดงผู้ใช้ในนำทาง(user);
    resolve(user);
  });
});

export function รอผู้ใช้ล็อกอิน() {
  return ตัวสัญญาผู้ใช้;
}

export async function ดึงชื่อผู้ใช้(uid) {
  try {
    var สแนปช็อต = await getDoc(doc(db, "users", uid));
    if (สแนปช็อต.exists() && สแนปช็อต.data().name) {
      return สแนปช็อต.data().name;
    }
  } catch (err) {
    // ปล่อยไปใช้ค่า fallback ด้านล่าง
  }
  return auth.currentUser ? auth.currentUser.email : "";
}

function แสดงผู้ใช้ในนำทาง(user) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;
  ที่วาง.innerHTML =
    esc(user.email) + ' <button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';
  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
    signOut(auth).then(function () { location.href = "login.html"; });
  });
}
