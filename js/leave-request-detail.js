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
import { รอผู้ใช้ล็อกอิน, รอบทบาทผู้ใช้, ดึงชื่อผู้ใช้ } from "./auth-guard.js";

(async function () {
  var ผู้ใช้ = await รอผู้ใช้ล็อกอิน();
  var บทบาท = await รอบทบาทผู้ใช้();
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

  // ผู้ขอลาเปิดใบของคนอื่นไม่ได้ (กันแค่ฝั่งหน้าจอ ของจริงรอ Firestore rules สัปดาห์ที่ 8)
  if (บทบาท === "employee" && ใบ.requesterId !== ผู้ใช้.uid) {
    กล่องใบลา.innerHTML = "<p>คุณไม่มีสิทธิ์ดูใบลานี้</p>";
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

    // ปุ่มอนุมัติ/ไม่อนุมัติ เฉพาะบทบาทที่มีสิทธิ์เปลี่ยนสถานะ · ปุ่มลบ เฉพาะเจ้าของใบเอง
    // ขึ้นทั้งคู่ก็ต่อเมื่อใบยังรอพิจารณาอยู่
    var เห็นปุ่มอนุมัติ = ใบ.status === "รอพิจารณา" && ตรวจสิทธิ์("เปลี่ยนสถานะใบลา", บทบาท);
    var เห็นปุ่มลบ = ใบ.status === "รอพิจารณา" && บทบาท === "employee" && ใบ.requesterId === ผู้ใช้.uid;

    // สรุปใบลาโดย AI ให้หัวหน้าอ่านก่อนกดอนุมัติ (สัปดาห์ที่ 8)
    // แสดงสรุปที่มีอยู่แล้วให้ทุกคนเห็น · ปุ่ม (สร้าง/แก้ไข) สรุปใหม่ ให้เฉพาะคนที่มีสิทธิ์อนุมัติตอนใบยังรอพิจารณา
    if (ใบ.aiSuggestion || เห็นปุ่มอนุมัติ) {
      html +=
        '<div style="margin-top:16px;">' +
        "<h2>สรุปจาก AI</h2>" +
        '<div id="ข้อความสรุปAI" class="alert alert-ai">' +
        (ใบ.aiSuggestion ? esc(ใบ.aiSuggestion) : "ยังไม่มีสรุปจาก AI") +
        "</div>";
      if (เห็นปุ่มอนุมัติ) {
        html +=
          '<p class="hint">ข้อเสนอจาก AI — โปรดตรวจสอบก่อนตัดสินใจ</p>' +
          '<div class="btn-row"><button type="button" class="btn-ghost" id="ปุ่มสรุปAI">ให้ AI ช่วยสรุปใบลา</button></div>' +
          '<div id="เตือนสรุปAI" class="alert alert-error hidden"></div>';
      }
      html += "</div>";
    }

    if (เห็นปุ่มอนุมัติ) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    }
    if (เห็นปุ่มลบ) {
      html += '<div class="btn-row"><button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลานี้</button></div>';
    }
    if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (เห็นปุ่มอนุมัติ) {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
    }
    if (เห็นปุ่มลบ) {
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── ให้ AI ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนกดอนุมัติ — เขียนผลกลับลงฟิลด์ aiSuggestion ──
  async function สรุปด้วยAI() {
    var ปุ่มสรุปAI = document.getElementById("ปุ่มสรุปAI");
    var เตือนสรุปAI = document.getElementById("เตือนสรุปAI");
    var ข้อความสรุปAI = document.getElementById("ข้อความสรุปAI");

    เตือนสรุปAI.classList.add("hidden");

    if (!window.OPENROUTER_API_KEY) {
      เตือนสรุปAI.textContent = "⚠️ ยังไม่ได้ตั้งค่าคีย์ AI (openrouter-key.local.js)";
      เตือนสรุปAI.classList.remove("hidden");
      return;
    }

    var ข้อความปุ่มปกติ = ปุ่มสรุปAI.textContent;
    ปุ่มสรุปAI.disabled = true;
    ปุ่มสรุปAI.textContent = "กำลังสรุป...";

    var ตัวควบคุมยกเลิก = new AbortController();
    var ตัวจับเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

    var ข้อความผู้ใช้ =
      "ช่วยสรุปใบลานี้:\n" +
      "หัวข้อ: " + ใบ.title + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "ผู้ขอลา: " + ใบ.requesterName + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "เหตุผล: " + ใบ.reason;

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
              content: "คุณคือผู้ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ ตอบกลับเป็นข้อความสรุปภาษาไทยสั้น กระชับ 1-2 ประโยคเท่านั้น ห้ามมีข้อความอื่นปน"
            },
            { role: "user", content: ข้อความผู้ใช้ }
          ]
        })
      });

      if (!ผลตอบกลับ.ok) throw new Error("สถานะ " + ผลตอบกลับ.status);

      var ข้อมูล = await ผลตอบกลับ.json();
      var สรุป = (ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message && ข้อมูล.choices[0].message.content || "").trim();

      if (!สรุป) throw new Error("ไม่ได้รับข้อความสรุปกลับมา");

      await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { aiSuggestion: สรุป });
      ใบ.aiSuggestion = สรุป;
      await บันทึกล็อกAI(ข้อความผู้ใช้, สรุป);
      วาดใบลา();
    } catch (err) {
      var ข้อความล้มเหลว = (err.name === "AbortError" ? "หมดเวลารอ" : err.message);
      ข้อความสรุปAI.textContent = ใบ.aiSuggestion || "ยังไม่มีสรุปจาก AI";
      เตือนสรุปAI.textContent = "⚠️ เรียก AI ไม่สำเร็จ: " + ข้อความล้มเหลว;
      เตือนสรุปAI.classList.remove("hidden");
      ปุ่มสรุปAI.disabled = false;
      ปุ่มสรุปAI.textContent = ข้อความปุ่มปกติ;
      await บันทึกล็อกAI(ข้อความผู้ใช้, "[ล้มเหลว] " + ข้อความล้มเหลว);
    } finally {
      clearTimeout(ตัวจับเวลา);
    }
  }

  // ── บันทึกประวัติการเรียก AI ทุกครั้งไว้ในโฟลเดอร์ย่อย aiLog ของใบนี้ ──
  async function บันทึกล็อกAI(input, output) {
    try {
      await addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
        input: input,
        output: output,
        createdAt: เวลาตอนนี้()
      });
    } catch (err) {
      // บันทึกล็อกไม่สำเร็จ ไม่บล็อกการแสดงผลสรุป
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

    var ความเห็นใหม่ = {
      authorId: ผู้ใช้.uid, authorName: await ดึงชื่อผู้ใช้(ผู้ใช้.uid),
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
