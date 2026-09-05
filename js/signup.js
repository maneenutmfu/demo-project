// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครด้วยอีเมล/รหัสผ่าน แล้วสร้างไฟล์ใน users/{uid}
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้อีก
// ⚠️ ระวัง: createUserWithEmailAndPassword ด้านล่างก็ทำให้ event นี้ยิงด้วยเช่นกัน
// (สมัครเสร็จ = ล็อกอินอัตโนมัติ) ถ้าไม่กันไว้ จะแย่งเด้งหน้าไปก่อน setDoc เขียนเสร็จ
var กำลังสมัคร = false;
onAuthStateChanged(auth, function (user) {
  if (user && !กำลังสมัคร) location.href = "leave-requests.html";
});

var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มสมัคร = document.getElementById("ปุ่มสมัคร");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var ชื่อ = document.getElementById("name").value.trim();
  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;
  var ยืนยันรหัสผ่าน = document.getElementById("confirmPassword").value;

  if (!ชื่อ || !อีเมล || !รหัสผ่าน) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดสมัคร");
    return;
  }
  if (รหัสผ่าน !== ยืนยันรหัสผ่าน) {
    เตือน("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    return;
  }

  กล่องเตือน.classList.add("hidden");
  ปุ่มสมัคร.disabled = true;

  กำลังสมัคร = true;
  try {
    var ข้อมูลรับรอง = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    await setDoc(doc(db, "users", ข้อมูลรับรอง.user.uid), {
      name: ชื่อ,
      email: อีเมล,
      role: "employee"
    });
    location.href = "leave-requests.html";
  } catch (err) {
    กำลังสมัคร = false;
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่มสมัคร.disabled = false;
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(err) {
  if (err.code === "auth/email-already-in-use") return "อีเมลนี้มีผู้ใช้แล้ว ลองเข้าสู่ระบบแทน";
  if (err.code === "auth/weak-password") return "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)";
  if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  return "สมัครสมาชิกไม่สำเร็จ: " + err.message;
}
