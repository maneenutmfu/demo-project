// หน้าทดสอบเรียก AI ผ่าน OpenRouter — ไฟล์นี้แยกจากระบบ LeaveEasy จริง
// ใช้ทดสอบการเชื่อมต่อเท่านั้น ไม่ใช่ฟีเจอร์ของสัปดาห์ที่ 6 (ปุ่มผู้ช่วย AI จริงคืองานสัปดาห์ที่ 8)

const โมเดลที่ใช้ = "google/gemini-2.5-flash-lite";

function แสดงสถานะ(ข้อความ) {
  const กล่องสถานะ = document.getElementById("สถานะ");
  กล่องสถานะ.textContent = ข้อความ;
}

function แสดงคำตอบ(ข้อความ) {
  const กล่องคำตอบ = document.getElementById("คำตอบ");
  กล่องคำตอบ.textContent = ข้อความ;
}

async function ส่งข้อความทดสอบ() {
  const ปุ่ม = document.getElementById("ปุ่มส่ง");

  if (!window.OPENROUTER_API_KEY) {
    แสดงสถานะ("ยังไม่พบคีย์ — คัดลอก openrouter-key.example.js เป็น openrouter-key.local.js แล้วใส่คีย์ของคุณ");
    return;
  }

  ปุ่ม.disabled = true;
  แสดงสถานะ("กำลังส่งคำถามไปยัง OpenRouter...");
  แสดงคำตอบ("");

  try {
    const ผลตอบกลับ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${window.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: โมเดลที่ใช้,
        messages: [{ role: "user", content: "สวัสดี" }],
      }),
    });

    if (!ผลตอบกลับ.ok) {
      const ข้อความผิดพลาด = await ผลตอบกลับ.text();
      throw new Error(`OpenRouter ตอบกลับผิดพลาด (${ผลตอบกลับ.status}): ${ข้อความผิดพลาด}`);
    }

    const ข้อมูล = await ผลตอบกลับ.json();
    const คำตอบจากAI = ข้อมูล.choices?.[0]?.message?.content ?? "(ไม่พบข้อความตอบกลับ)";

    แสดงสถานะ("ได้รับคำตอบแล้ว");
    แสดงคำตอบ(คำตอบจากAI);
  } catch (ข้อผิดพลาด) {
    แสดงสถานะ("เกิดข้อผิดพลาด");
    แสดงคำตอบ(String(ข้อผิดพลาด));
  } finally {
    ปุ่ม.disabled = false;
  }
}

document.getElementById("ปุ่มส่ง").addEventListener("click", ส่งข้อความทดสอบ);
