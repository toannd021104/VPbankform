// Use Case 2 - CRM Update Form Script (DB-only, no LocalStorage, no confirm on clear)

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("crmUpdateForm");
  const clearBtn = document.getElementById("clearBtn");
  const aiTestBtn = document.getElementById("aiTestBtn");

  // Initialize common features
  initializeCommonFeatures(form);

  // Initialize AI Integration
  const formAI = new FormAI("crmUpdateForm");

  // Defaults: today & now
  const interactionDateField = document.getElementById("interactionDate");
  if (interactionDateField)
    interactionDateField.value = new Date().toISOString().split("T")[0];

  const interactionTimeField = document.getElementById("interactionTime");
  (function setNow() {
    if (!interactionTimeField) return;
    const now = new Date();
    interactionTimeField.value = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}`;
  })();

  // Submit (giữ validateForm nếu bạn muốn chặn submit ở JS)
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (typeof validateForm === "function" && !validateForm(form)) {
      showAlert("Vui lòng kiểm tra lại thông tin đã nhập", "error");
      return;
    }

    const formData = getFormData(form);
    showModal(
      "Xác Nhận Cập Nhật",
      "Bạn có chắc chắn muốn cập nhật thông tin CRM này không?",
      () => {
        console.log("Updating CRM:", formData);
        showAlert("Thông tin CRM đã được cập nhật thành công!", "success");
        form.reset();
        if (interactionDateField)
          interactionDateField.value = new Date().toISOString().split("T")[0];
        if (interactionTimeField) {
          const now = new Date();
          interactionTimeField.value = `${String(now.getHours()).padStart(
            2,
            "0"
          )}:${String(now.getMinutes()).padStart(2, "0")}`;
        }
      }
    );
  });

  // Clear button — xóa ngay (KHÔNG xác nhận). Việc wipe Supabase làm trong block Supabase phía dưới.
  clearBtn.addEventListener("click", function () {
    if (typeof formAI?.resetForm === "function") formAI.resetForm();
    form.reset();
    if (interactionDateField)
      interactionDateField.value = new Date().toISOString().split("T")[0];
    if (interactionTimeField) {
      const now = new Date();
      interactionTimeField.value = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
    showAlert("Form đã được xóa", "info");
    // Supabase wipe sẽ chạy ngay sau (được gắn listener dưới block Supabase)
    document.dispatchEvent(new CustomEvent("crm:clear-clicked")); // tín hiệu cho block Supabase
  });

  // AI Test button - simulates AI filling the form
  aiTestBtn.addEventListener("click", async function () {
    const testData = {
      customerName: "Nguyễn Văn Bình",
      customerId: "CUS987654",
      phoneNumber: "0912345678",
      email: "nguyenvanbinh@example.com",
      address: "25A Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
      interactionType: "call",
      interactionDate: new Date().toISOString().split("T")[0],
      interactionTime: new Date().toTimeString().slice(0, 5),
      duration: "5",
      agentName: "Trần Thị Mai",
      issueCategory: "account",
      issueDescription: "Khách hàng yêu cầu cập nhật địa chỉ mới",
      resolutionStatus: "resolved",
      resolutionDetails: "Đã cập nhật địa chỉ mới vào hệ thống CRM",
      satisfactionRating: "5",
      followUpRequired: "no",
    };

    const result = formAI.fillForm(testData);
    if (result.success) {
      showAlert(
        `AI đã điền thành công ${result.filledFields.length} trường`,
        "success"
      );
    } else {
      showAlert("Có lỗi khi AI điền form", "error");
      console.error("AI Fill errors:", result.errors);
    }
  });

  // Follow-up UX (KHÔNG đặt required runtime)
  const followUpRequired = document.getElementById("followUpRequired");
  const followUpDate = document.getElementById("followUpDate");
  followUpRequired?.addEventListener("change", function () {
    if (this.value === "yes" && followUpDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      followUpDate.value = nextWeek.toISOString().split("T")[0];
    } else if (followUpDate) {
      followUpDate.value = "";
    }
  });
});

// Expose FormAI instance for external AI service integration
window.crmFormAI = null;
document.addEventListener("DOMContentLoaded", function () {
  window.crmFormAI = new FormAI("crmUpdateForm");
});

// === Shared State Sync (Supabase) — Case 2 CRM (DB-only) ===
(function () {
  if (typeof window === "undefined") return;
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("[Supabase] SDK not loaded.");
    return;
  }
  const SB_URL = window.__SB_URL__;
  const SB_ANON = window.__SB_ANON__;
  const TABLE = window.__TABLE__ || "crm_forms";
  const ROW_ID = window.__ROW_ID__ || "vpbank_crm_update_shared_form";
  const client = window.supabase.createClient(SB_URL, SB_ANON);

  // Prefer #crmUpdateForm; fallback to first <form>
  let form =
    document.getElementById("crmUpdateForm") || document.querySelector("form");
  if (!form) {
    console.warn("[Supabase] No form found");
    return;
  }

  function isSavable(el) {
    if (!el || el.disabled) return false;
    const t = (el.type || "").toLowerCase();
    const tag = (el.tagName || "").toLowerCase();
    if (["button", "submit", "reset", "file"].includes(t)) return false;
    if (tag === "fieldset") return false;
    return Boolean(el.name || el.id);
  }
  const keyOf = (el) => el.name || el.id;

  function serializeAll() {
    const values = {};
    const fields = Array.from(form.elements).filter(isSavable);
    const radioGroupsHandled = new Set();
    fields.forEach((el) => {
      const name = keyOf(el);
      if (!name) return;
      if (el.type === "radio") {
        if (radioGroupsHandled.has(name)) return;
        radioGroupsHandled.add(name);
        const checked = form.querySelector(
          `input[type="radio"][name="${CSS.escape(name)}"]:checked`
        );
        values[name] = checked ? checked.value : "";
      } else if (el.type === "checkbox") {
        values[name] = !!el.checked;
      } else if (el.tagName === "SELECT" && el.multiple) {
        values[name] = Array.from(el.options)
          .filter((o) => o.selected)
          .map((o) => o.value);
      } else {
        values[name] = el.value ?? "";
      }
    });
    return values;
  }

  function applyToForm(data) {
    if (!data || typeof data !== "object") return;
    Object.entries(data).forEach(([name, value]) => {
      const nodes = form.querySelectorAll(
        `[name="${CSS.escape(name)}"], #${CSS.escape(name)}`
      );
      if (!nodes.length) return;
      const first = nodes[0];
      if (first.type === "radio") {
        nodes.forEach((el) => {
          el.checked = el.value === value;
        });
      } else if (first.type === "checkbox") {
        nodes.forEach((el) => (el.checked = !!value));
      } else if (first.tagName === "SELECT") {
        if (first.multiple && Array.isArray(value)) {
          Array.from(first.options).forEach(
            (opt) => (opt.selected = value.includes(opt.value))
          );
        } else {
          first.value = value ?? "";
        }
      } else if (first.type !== "file") {
        nodes.forEach((el) => (el.value = value ?? ""));
      }
    });
  }

  // initial load
  (async function initialLoad() {
    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (!error && data && data.data) applyToForm(data.data);
  })();

  // debounce save
  let saveTimer = null,
    isLocal = false,
    last = 0;
  async function upsertNow() {
    try {
      isLocal = true;
    } catch {}
    try {
      const payload = {
        id: ROW_ID,
        data: serializeAll(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await client
        .from(TABLE)
        .upsert(payload, { onConflict: "id" });
      if (error) console.error("[Supabase] upsert error:", error);
      last = Date.now();
    } finally {
      isLocal = false;
    }
  }
  function schedule() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(upsertNow, 300);
  }
  form.addEventListener("input", schedule, true);
  form.addEventListener("change", schedule, true);
  form.addEventListener("submit", schedule, true);

  // clear — KHÔNG xác nhận: reset UI + upsert {}
  document.addEventListener("crm:clear-clicked", async () => {
    try {
      isLocal = true;
    } catch {}
    await client
      .from(TABLE)
      .upsert(
        { id: ROW_ID, data: {}, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    last = Date.now();
    isLocal = false;
  });

  // realtime
  const ch = client
    .channel("realtime:" + TABLE + ":" + ROW_ID)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        if (isLocal || Date.now() - last < 250) return;
        const incoming = payload.new && payload.new.data;
        if (incoming) {
          applyToForm(incoming);
          last = Date.now();
        }
      }
    )
    .subscribe();

  // cleanup
  window.addEventListener("beforeunload", () => {
    try {
      client.removeChannel(ch);
    } catch {}
  });
})();
// === End Shared State Sync ===
