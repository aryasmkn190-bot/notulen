import assert from "node:assert/strict";

const BASE_URL = "http://127.0.0.1:3088/api";

async function runTests() {
  console.log("Running Notula Auth & Role Boundary Tests...");

  // 1. Test Login Super Admin
  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminData = await adminRes.json();
  assert.equal(adminRes.status, 200);
  assert.equal(adminData.user.role, "superadmin");
  const adminToken = adminData.token;

  // 2. Test Login Moderator (Notulen)
  const modRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "notulen", password: "notulis123" }),
  });
  const modData = await modRes.json();
  assert.equal(modRes.status, 200);
  assert.equal(modData.user.role, "moderator");
  const modToken = modData.token;

  // 3. Test Login Guru
  const guruRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "guru", password: "guru123" }),
  });
  const guruData = await guruRes.json();
  assert.equal(guruRes.status, 200);
  assert.equal(guruData.user.role, "guru");
  const guruToken = guruData.token;

  // 4. Guru forbidden to create meeting
  const guruCreateRes = await fetch(`${BASE_URL}/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${guruToken}`,
    },
    body: JSON.stringify({ judul: "Rapat Guru Unauthorized", jenis: "Lainnya" }),
  });
  assert.equal(guruCreateRes.status, 403);

  // 5. Moderator can create meeting
  const modCreateRes = await fetch(`${BASE_URL}/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({
      judul: "Rapat Uji Peran Notulen",
      jenis: "Rapat Guru",
      tanggal: "2026-09-20",
    }),
  });
  assert.equal(modCreateRes.status, 201);
  const testMeeting = await modCreateRes.json();
  const meetingId = testMeeting.id;

  // 6. Moderator CANNOT finalize meeting
  const modFinalizeRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({ is_finalized: true }),
  });
  assert.equal(modFinalizeRes.status, 403);

  // 7. Super Admin CAN finalize meeting
  const adminFinalizeRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ is_finalized: true }),
  });
  assert.equal(adminFinalizeRes.status, 200);
  const finalizedMeeting = await adminFinalizeRes.json();
  assert.equal(finalizedMeeting.is_finalized, true);

  // 8. Moderator CANNOT edit notes of finalized meeting
  const modEditFinalRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({ catatan: "Edit terlarang" }),
  });
  assert.equal(modEditFinalRes.status, 403);

  // 9. Guru CAN add question to the finalized meeting
  const guruQRes = await fetch(`${BASE_URL}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${guruToken}`,
    },
    body: JSON.stringify({
      mid: meetingId,
      teks: "Pertanyaan uji dari Ibu Rina",
    }),
  });
  assert.equal(guruQRes.status, 201);
  const testQ = await guruQRes.json();
  assert.equal(testQ.user_id, guruData.user.id);

  // 10. Moderator CAN edit questions on finalized meeting
  const modEditQRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({
      status: "proses",
      pic: "Tim Kurikulum",
      logTeks: "Diverifikasi oleh notulis",
    }),
  });
  assert.equal(modEditQRes.status, 200);

  // 11. Moderator CAN update question prioritas and output lampiran
  const dummyLampiran = [
    {
      id: "doc-test-1",
      name: "sk_penugasan.pdf",
      type: "application/pdf",
      size: 1024,
      url: "/uploads/test.pdf",
    },
  ];
  const modPrioritasRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({
      prioritas: "Tinggi",
      output: "Aturan / Kebijakan",
      lampiran: dummyLampiran,
    }),
  });
  assert.equal(modPrioritasRes.status, 200);
  const updatedModQ = await modPrioritasRes.json();
  assert.equal(updatedModQ.prioritas, "Tinggi");
  assert.equal(updatedModQ.output, "Aturan / Kebijakan");
  assert.equal(updatedModQ.lampiran.length, 1);

  // 12. Guru CANNOT update question prioritas or lampiran (must return 403)
  const guruEditPrioritasRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${guruToken}`,
    },
    body: JSON.stringify({
      prioritas: "Rendah",
    }),
  });
  assert.equal(guruEditPrioritasRes.status, 403);

  // 13. Super Admin CAN update question prioritas and lampiran
  const adminEditPrioritasRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      prioritas: "Sedang",
      output: "SOP",
    }),
  });
  assert.equal(adminEditPrioritasRes.status, 200);
  const updatedAdminQ = await adminEditPrioritasRes.json();
  assert.equal(updatedAdminQ.prioritas, "Sedang");
  assert.equal(updatedAdminQ.output, "SOP");

  // 14. Verify auto-generated system log for priority change exists
  const hasPriLog = updatedAdminQ.log.some(
    (l) => l.type === "system" && l.teks.includes("Prioritas diubah")
  );
  assert.equal(hasPriLog, true, "Must have auto-generated system log for priority change");

  // 15. Moderator edits a manual log entry
  const manualLog = updatedAdminQ.log.find((l) => l.type === "manual");
  assert.ok(manualLog, "Must have at least one manual log");
  const editedLogList = updatedAdminQ.log.map((l) =>
    l.id === manualLog.id ? { ...l, teks: "Catatan manual berhasil diedit oleh notulis" } : l
  );
  const editManualLogRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({ log: editedLogList }),
  });
  assert.equal(editManualLogRes.status, 200);
  const resAfterEdit = await editManualLogRes.json();
  const checkedEditedLog = resAfterEdit.log.find((l) => l.id === manualLog.id);
  assert.equal(checkedEditedLog.teks, "Catatan manual berhasil diedit oleh notulis");

  // 16. Moderator deletes a manual log entry
  const deletedLogList = resAfterEdit.log.filter((l) => l.id !== manualLog.id);
  const deleteManualLogRes = await fetch(`${BASE_URL}/questions/${testQ.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modToken}`,
    },
    body: JSON.stringify({ log: deletedLogList }),
  });
  assert.equal(deleteManualLogRes.status, 200);
  const resAfterDelete = await deleteManualLogRes.json();
  assert.equal(
    resAfterDelete.log.some((l) => l.id === manualLog.id),
    false,
    "Manual log should be deleted"
  );

  // Cleanup: Super admin deletes test meeting
  const deleteRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.equal(deleteRes.status, 200);

  console.log("All 16 Auth, Role Boundary, Auto-Log & Manual Log checks passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
