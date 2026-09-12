// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง (collection "leaveRequests")
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { รอผู้ใช้ล็อกอิน, รอบทบาทผู้ใช้, ดึงชื่อผู้ใช้ } from "./auth-guard.js";

(async function () {
  var ผู้ใช้ = await รอผู้ใช้ล็อกอิน();
  var บทบาท = await รอบทบาทผู้ใช้();

  // หน้านี้สำหรับผู้ขอลาเท่านั้น กันเข้าถึงตรง ๆ ทาง URL
  if (!ตรวจสิทธิ์("ยื่นใบลาใหม่", บทบาท)) {
    alert("หน้านี้สำหรับผู้ขอลาเท่านั้น");
    location.href = "leave-requests.html";
    return;
  }

  var ชื่อผู้ใช้ = await ดึงชื่อผู้ใช้(ผู้ใช้.uid);

  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  window.LEAVE_DATA.leaveTypes.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  // ปุ่มให้ AI ช่วยจัดประเภทการลา (สัปดาห์ที่ 8)
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var ป้ายAI = document.getElementById("ป้ายAI");
  var ช่องเหตุผล = document.getElementById("reason");
  var ข้อความปุ่มAIปกติ = ปุ่มAI.textContent;

  ปุ่มAI.addEventListener("click", จัดประเภทด้วยAI);

  async function จัดประเภทด้วยAI() {
    var เหตุผล = ช่องเหตุผล.value.trim();
    กล่องเตือน.classList.add("hidden");
    ป้ายAI.classList.add("hidden");

    if (!เหตุผล) {
      เตือน("พิมพ์เหตุผลการลาก่อน จึงให้ AI ช่วยจัดประเภทได้");
      return;
    }
    if (!window.OPENROUTER_API_KEY) {
      เตือน("ยังไม่ได้ตั้งค่าคีย์ AI (openrouter-key.local.js)");
      return;
    }

    var รายชื่อประเภท = window.LEAVE_DATA.leaveTypes;
    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "กำลังจัดประเภท...";

    var ตัวควบคุมยกเลิก = new AbortController();
    var ตัวจับเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

    try {
      var ผลตอบกลับ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวควบคุมยกเลิก.signal,
        headers: {
          "Authorization": "Bearer " + window.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "คุณคือระบบช่วยจัดประเภทการลา ตอบกลับด้วย id ของประเภทการลาที่ตรงที่สุดเพียงค่าเดียวเท่านั้น ห้ามมีข้อความอื่นปน ถ้าไม่มีประเภทใดตรงเลย ให้ตอบว่า ไม่พบ"
            },
            {
              role: "user",
              content: "รายชื่อประเภทการลาที่มีอยู่จริง:\n" +
                รายชื่อประเภท.map(function (t) { return t.id + " = " + t.name; }).join("\n") +
                "\n\nเหตุผลการลา: " + เหตุผล
            }
          ]
        })
      });

      if (!ผลตอบกลับ.ok) throw new Error("สถานะ " + ผลตอบกลับ.status);

      var ข้อมูล = await ผลตอบกลับ.json();
      var รหัสที่ตอบ = (ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message && ข้อมูล.choices[0].message.content || "").trim();
      var ประเภทที่ตรง = รายชื่อประเภท.find(function (t) { return รหัสที่ตอบ.indexOf(t.id) !== -1; });

      if (!ประเภทที่ตรง) {
        เตือน("AI จัดประเภทให้ไม่ได้ — โปรดเลือกเอง");
        return;
      }

      ช่องประเภท.value = ประเภทที่ตรง.id;
      ป้ายAI.classList.remove("hidden");
    } catch (err) {
      เตือน("เรียก AI ไม่สำเร็จ: " + (err.name === "AbortError" ? "หมดเวลารอ" : err.message));
    } finally {
      clearTimeout(ตัวจับเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มAIปกติ;
    }
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === ค่า.leaveTypeId; });

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้.uid, requesterName: ชื่อผู้ใช้,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    บันทึกลงFirestore(ใบใหม่);
  });

  async function บันทึกลงFirestore(ใบใหม่) {
    กล่องเตือน.classList.add("hidden");
    ปุ่มบันทึก.disabled = true;
    try {
      await addDoc(collection(db, "leaveRequests"), ใบใหม่);
      location.href = "leave-requests.html";
    } catch (err) {
      ปุ่มบันทึก.disabled = false;
      เตือน("บันทึกใบลาไม่สำเร็จ: " + err.message);
    }
  }

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
