// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลปลอมจาก js/data.js ขึ้น Firestore ครั้งเดียว
// รันจาก seed.html เท่านั้น ไม่ได้ใช้ในหน้าจอปกติของระบบ
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  collection
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.getElementById("ปุ่มเริ่ม").addEventListener("click", เริ่มใส่ข้อมูล);

async function เริ่มใส่ข้อมูล() {
  var ปุ่ม = document.getElementById("ปุ่มเริ่ม");
  var กล่องสถานะ = document.getElementById("สถานะ");
  ปุ่ม.disabled = true;
  กล่องสถานะ.textContent = "กำลังใส่ข้อมูล…\n";

  try {
    for (var u of window.LEAVE_DATA.users) {
      await setDoc(doc(db, "users", u.id), u);
    }
    กล่องสถานะ.textContent += "✅ users " + window.LEAVE_DATA.users.length + " รายการ\n";

    for (var t of window.LEAVE_DATA.leaveTypes) {
      await setDoc(doc(db, "leaveTypes", t.id), t);
    }
    กล่องสถานะ.textContent += "✅ leaveTypes " + window.LEAVE_DATA.leaveTypes.length + " รายการ\n";

    for (var r of window.LEAVE_DATA.leaveRequests) {
      await setDoc(doc(db, "leaveRequests", r.id), r);
    }
    กล่องสถานะ.textContent += "✅ leaveRequests " + window.LEAVE_DATA.leaveRequests.length + " รายการ\n";

    for (var a of window.LEAVE_DATA.approvals) {
      await setDoc(doc(db, "leaveRequests", a.requestId, "approvals", a.id), a);
    }
    กล่องสถานะ.textContent += "✅ approvals " + window.LEAVE_DATA.approvals.length + " รายการ\n";

    กล่องสถานะ.textContent += "\nเสร็จแล้ว — เปิด Firebase Console ดูข้อมูลได้เลย";
  } catch (err) {
    กล่องสถานะ.textContent += "\n❌ ใส่ข้อมูลไม่สำเร็จ: " + err.message;
  } finally {
    ปุ่ม.disabled = false;
  }
}
