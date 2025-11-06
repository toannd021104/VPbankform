// Wizard 3 bước — không modal, không required, hành động tức thì
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("hrWorkflowForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // Đặt ngày nộp đơn mặc định = hôm nay nếu trống
  const submissionDateField = document.getElementById("submissionDate");
  if (submissionDateField && !submissionDateField.value) {
    submissionDateField.value = new Date().toISOString().split("T")[0];
  }

  let current = 1;
  const total = panes.length;

  function setStep(n) {
    current = Math.max(1, Math.min(total, n));
    panes.forEach((p) =>
      p.classList.toggle("is-hidden", Number(p.dataset.step) !== current)
    );
    steps.forEach((s) => {
      const st = Number(s.dataset.step);
      s.classList.toggle("is-active", st === current);
      s.classList.toggle("is-done", st < current);
    });
    const pct = Math.round(((current - 1) / (total - 1)) * 100);
    if (barFill) barFill.style.width = `${pct}%`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Điều hướng tức thì
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn-next")) setStep(current + 1);
    if (e.target.closest(".btn-prev")) setStep(current - 1);

    // Thêm tính năng click vào step để chuyển trang
    if (e.target.closest(".wizard-step")) {
      const clickedStep = e.target.closest(".wizard-step");
      const stepNumber = Number(clickedStep.dataset.step);
      if (stepNumber && stepNumber >= 1 && stepNumber <= total) {
        setStep(stepNumber);
      }
    }

    if (e.target.closest("#clearBtn")) {
      // Blur form area (không blur toast)
      document.querySelector("main").style.filter = "blur(2px)";

      form.reset();
      form.querySelectorAll("textarea").forEach((el) => (el.value = ""));
      form.querySelectorAll("select").forEach((el) => {
        if (el.querySelector('option[value=""]')) el.value = "";
      });

      // Ẩn các nhóm field phụ thuộc
      const leaveTypeGroup = document.getElementById("leaveTypeGroup");
      const rejectionReasonGroup = document.getElementById(
        "rejectionReasonGroup"
      );
      if (leaveTypeGroup) leaveTypeGroup.style.display = "none";
      if (rejectionReasonGroup) rejectionReasonGroup.style.display = "none";

      if (submissionDateField)
        submissionDateField.value = new Date().toISOString().split("T")[0];
      setStep(1);

      // Remove blur sau 0.4 giây
      setTimeout(() => {
        document.querySelector("main").style.filter = "none";
      }, 400);

      // Đồng bộ Supabase (nếu có) — phát sự kiện change để các listener khác bắt được
      document.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Submit ngay lập tức, hiển thị Toast
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Submitting HR request:", getFormData(form));

    // Hiển thị Toast
    showToast("✓ Nộp đơn thành công");

    // Blur form area (không blur toast)
    document.querySelector("main").style.filter = "blur(2px)";

    form.reset();
    setStep(1);
    if (submissionDateField)
      submissionDateField.value = new Date().toISOString().split("T")[0];

    // Remove blur sau 0.4 giây
    setTimeout(() => {
      document.querySelector("main").style.filter = "none";
    }, 400);

    // Đồng bộ Supabase
    document.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Request type change handler
  const requestType = document.getElementById("requestType");
  const leaveTypeGroup = document.getElementById("leaveTypeGroup");

  requestType?.addEventListener("change", function () {
    leaveTypeGroup.style.display = this.value === "leave" ? "block" : "none";
  });

  // Approval status change handler
  const approvalStatus = document.getElementById("approvalStatus");
  const rejectionReasonGroup = document.getElementById("rejectionReasonGroup");

  approvalStatus?.addEventListener("change", function () {
    rejectionReasonGroup.style.display =
      this.value === "rejected" ? "block" : "none";
  });

  // Calculate duration between start and end dates
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const duration = document.getElementById("duration");

  function calculateDuration() {
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);

      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        duration.value = diffDays;
      } else {
        duration.value = "";
      }
    }
  }

  startDate?.addEventListener("change", calculateDuration);
  endDate?.addEventListener("change", calculateDuration);

  setStep(1);
});

// Toast function
function showToast(message, duration = 5000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  // Clear previous class
  toast.classList.remove("show", "hide");

  // Set message
  toast.textContent = message;

  // Show
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Hide after duration
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, duration);
}

// Helper functions
function showAlert(message, type) {
  console.log(`${type}: ${message}`);
  // Có thể thêm hiển thị alert UI nếu cần
}

function getFormData(form) {
  const formData = {};
  const elements = form.elements;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.name) {
      if (element.type === "checkbox") {
        formData[element.name] = element.checked;
      } else if (element.type === "radio") {
        if (element.checked) {
          formData[element.name] = element.value;
        }
      } else {
        formData[element.name] = element.value;
      }
    }
  }
  return formData;
}

// ===== Toast Notification =====
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hide");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 5000);
}

// ===== Supabase Shared State =====
(function () {
  const FORM_ID = "hrWorkflowForm";
  const form = document.getElementById(FORM_ID);
  if (!form) return;

  if (!window.supabase || !window.__SB_URL__ || !window.__SB_ANON__) return;

  const sb = window.supabase.createClient(
    window.__SB_URL__,
    window.__SB_ANON__
  );
  const FORM_ROW_ID = "use-case-3-hr-workflow";
  const TABLE = window.__TABLE__ || "hr_forms";

  function serializeAll() {
    const data = {};
    const fields = form.querySelectorAll("input, select, textarea");
    const radioHandled = new Set();
    fields.forEach((el) => {
      const name = el.name || el.id;
      if (!name) return;
      if (el.type === "radio") {
        if (radioHandled.has(name)) return;
        radioHandled.add(name);
        const checked = form.querySelector(
          `input[type="radio"][name="${CSS.escape(name)}"]:checked`
        );
        data[name] = checked ? checked.value : null;
      } else if (el.type === "checkbox") {
        data[name] = el.checked;
      } else if (el.type === "file") {
        data[name] = el.files && el.files.length ? el.files[0].name : "";
      } else {
        data[name] = el.value;
      }
    });
    return data;
  }

  function restoreAll(payload) {
    if (!payload) return;
    Object.entries(payload).forEach(([name, value]) => {
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
        first.value = value ?? "";
      } else if (first.type !== "file") {
        nodes.forEach((el) => (el.value = value ?? ""));
      }
    });

    // Cập nhật hiển thị các nhóm field phụ thuộc sau khi restore
    const requestType = document.getElementById("requestType");
    const leaveTypeGroup = document.getElementById("leaveTypeGroup");
    const approvalStatus = document.getElementById("approvalStatus");
    const rejectionReasonGroup = document.getElementById(
      "rejectionReasonGroup"
    );

    if (requestType && leaveTypeGroup) {
      leaveTypeGroup.style.display =
        requestType.value === "leave" ? "block" : "none";
    }
    if (approvalStatus && rejectionReasonGroup) {
      rejectionReasonGroup.style.display =
        approvalStatus.value === "rejected" ? "block" : "none";
    }
  }

  async function loadShared() {
    const { data, error } = await sb
      .from(TABLE)
      .select("data")
      .eq("id", FORM_ROW_ID)
      .maybeSingle();
    if (!error && data && data.data) restoreAll(data.data);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadShared);
  } else {
    loadShared();
  }

  let saveTimer = null,
    isLocal = false,
    lastApply = 0;

  async function upsertNow() {
    try {
      isLocal = true;
    } catch {}
    try {
      const payload = {
        id: FORM_ROW_ID,
        data: serializeAll(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb
        .from(TABLE)
        .upsert(payload, { onConflict: "id" });
      if (error) console.error("[Supabase] upsert error:", error);
      lastApply = Date.now();
    } finally {
      isLocal = false;
    }
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(upsertNow, 300);
  }
  document.addEventListener("input", scheduleSave, true);
  document.addEventListener("change", scheduleSave, true);

  const channel = sb
    .channel("realtime:" + TABLE + ":" + FORM_ROW_ID)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLE,
        filter: `id=eq.${FORM_ROW_ID}`,
      },
      (payload) => {
        if (isLocal || Date.now() - lastApply < 200) return;
        const incoming = payload.new && payload.new.data;
        if (incoming) {
          restoreAll(incoming);
          lastApply = Date.now();
        }
      }
    )
    .subscribe();

  window.addEventListener("beforeunload", () => {
    try {
      sb.removeChannel(channel);
    } catch {}
  });
})();
// ===== end Supabase Shared State =====
