// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน/เขียนใบลาและความเห็นจริงจาก Firestore
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  // หาใบลาจาก Firestore
  var ใบ;
  try {
    var สแนปช็อต = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (สแนปช็อต.exists()) {
      ใบ = Object.assign({}, สแนปช็อต.data(), { id: สแนปช็อต.id });
    }
  } catch (err) {
    // ปล่อยให้ ใบ เป็น undefined ถือว่าไม่พบ
  }

  if (!ใบ) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  // อ่านความเห็นการอนุมัติจากโฟลเดอร์ย่อย approvals ของใบนี้
  var ความเห็น = [];
  try {
    var รายการสแนปช็อต = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
    รายการสแนปช็อต.forEach(function (เอกสาร) {
      ความเห็น.push(Object.assign({}, เอกสาร.data(), { id: เอกสาร.id }));
    });
  } catch (err) {
    // ปล่อยว่างไว้ ไม่บล็อกการแสดงใบลา
  }

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    if (ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลานี้</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── เปลี่ยนสถานะ — เขียนลง Firestore เฉพาะช่อง status เท่านั้น ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    var ปุ่มก = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มข = document.getElementById("ปุ่มไม่อนุมัติ");
    if (ปุ่มก) ปุ่มก.disabled = true;
    if (ปุ่มข) ปุ่มข.disabled = true;

    try {
      await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
      ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
      วาดใบลา();
    } catch (err) {
      alert("เปลี่ยนสถานะไม่สำเร็จ: " + err.message);
      if (ปุ่มก) ปุ่มก.disabled = false;
      if (ปุ่มข) ปุ่มข.disabled = false;
    }
  }

  // ── ลบใบลา — ต้องถามยืนยันก่อนเสมอ กดยกเลิกแล้วต้องไม่ลบ ──
  async function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;

    var ปุ่มลบ = document.getElementById("ปุ่มลบ");
    if (ปุ่มลบ) ปุ่มลบ.disabled = true;

    try {
      await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
      location.href = "leave-requests.html";
    } catch (err) {
      alert("ลบใบลาไม่สำเร็จ: " + err.message);
      if (ปุ่มลบ) ปุ่มลบ.disabled = false;
    }
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ — บันทึกลงโฟลเดอร์ย่อย approvals ของใบนี้จริง ──
  async function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");
    ปุ่มส่ง.disabled = true;

    // สัปดาห์ที่ 7 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
    var ความเห็นใหม่ = {
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    try {
      var อ้างอิง = await addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่);
      ความเห็น.push(Object.assign({}, ความเห็นใหม่, { id: อ้างอิง.id }));
      ช่อง.value = "";
      วาดความเห็น();
    } catch (err) {
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    } finally {
      ปุ่มส่ง.disabled = false;
    }
  }
})();
