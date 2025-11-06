// Wizard 3 bước — không modal, không required, hành động tức thì
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loanOriginationForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // Đặt ngày đăng ký mặc định = hôm nay nếu trống
  const applicationDateField = document.getElementById("applicationDate");
  if (applicationDateField && !applicationDateField.value) {
    applicationDateField.value = new Date().toISOString().split("T")[0];
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
    const pct = Math.round((current / total) * 100);
    if (barFill) barFill.style.width = `${pct}%`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Điều hướng tức thì
  document.addEventListener("click", (e) => {
    if (e.target.closest(".wizard-next")) setStep(current + 1);
    if (e.target.closest(".wizard-prev")) setStep(current - 1);

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

      // Reset form
      form.reset();
      form.querySelectorAll("textarea").forEach((el) => (el.value = ""));
      form.querySelectorAll("select").forEach((el) => {
        if (el.querySelector('option[value=""]')) el.value = "";
      });
      if (applicationDateField)
        applicationDateField.value = new Date().toISOString().split("T")[0];

      // Quay lại step 1
      setStep(1);

      // Remove blur sau 0.4 giây
      setTimeout(() => {
        document.querySelector("main").style.filter = "none";
      }, 400);

      // Đồng bộ Supabase
      document.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Submit ngay lập tức, hiển thị Toast
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Hiển thị Toast
    showToast("✓ Đăng ký vay thành công");

    // Blur form area (không blur toast)
    document.querySelector("main").style.filter = "blur(2px)";

    // Reset form ngay
    form.reset();

    // Quay lại step 1 ngay
    setStep(1);

    // Remove blur sau 0.4 giây
    setTimeout(() => {
      document.querySelector("main").style.filter = "none";
    }, 400);
  });

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

// ===== Supabase Shared State (giữ nguyên) =====
(function () {
  const FORM_ID = "loanOriginationForm";
  const form = document.getElementById(FORM_ID);
  if (!form) return;

  if (!window.supabase || !window.__SB_URL__ || !window.__SB_ANON__) return;

  const sb = window.supabase.createClient(
    window.__SB_URL__,
    window.__SB_ANON__
  );
  const FORM_ROW_ID = "vpbank_loan_kyc_shared_form";

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
  }

  async function loadShared() {
    const { data, error } = await sb
      .from("forms")
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
        .from("forms")
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
    .channel("realtime:forms:" + FORM_ROW_ID)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "forms",
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
