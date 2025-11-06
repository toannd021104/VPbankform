// Wizard 3 bước - Compliance Reporting
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("complianceForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // UI dependencies
  const violationsFound = document.getElementById("violationsFound");
  const violationDetailsGroup = document.getElementById(
    "violationDetailsGroup"
  );
  const followUpRequired = document.getElementById("followUpRequired");
  const followUpDateGroup = document.getElementById("followUpDateGroup");

  function toggleDeps() {
    violationDetailsGroup.style.display =
      violationsFound.value === "minor" || violationsFound.value === "major"
        ? "block"
        : "none";
    followUpDateGroup.style.display =
      followUpRequired.value === "yes" ? "block" : "none";
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
  });

  // Submit ngay lập tức, hiển thị Toast
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Hiển thị Toast
    showToast("✓ Báo cáo đã được gửi");

    // Blur form area (không blur toast)
    document.querySelector("main").style.filter = "blur(2px)";

    // Reset form ngay
    form.reset();

    // Quay lại step 1 ngay
    setStep(1);
    toggleDeps();

    // Remove blur sau 0.4 giây
    setTimeout(() => {
      document.querySelector("main").style.filter = "none";
    }, 400);

    // Đồng bộ Supabase
    document.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Clear button handler
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Blur form area (không blur toast)
      document.querySelector("main").style.filter = "blur(2px)";

      // Reset form
      form.reset();

      // Quay lại step 1
      setStep(1);
      toggleDeps();

      // Remove blur sau 0.4 giây
      setTimeout(() => {
        document.querySelector("main").style.filter = "none";
      }, 400);

      // Đồng bộ Supabase
      document.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  // Wire UI dependency events
  form.addEventListener("change", (e) => {
    if (e.target === violationsFound || e.target === followUpRequired)
      toggleDeps();
  });

  setStep(1);
  toggleDeps();
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

// ===== Supabase Shared State =====
(function () {
  const FORM_ID = "complianceForm";
  const TABLE = window.__TABLE__ || "compliance_forms";
  const ROW_ID = window.__ROW_ID__ || "use-case-4-compliance-reporting";
  const SB_URL = window.__SB_URL__;
  const SB_KEY = window.__SB_ANON__;
  const SAVE_MS = 300;

  const form = document.getElementById(FORM_ID);
  const clearBtn = document.getElementById("clearBtn");
  const violationsFound = document.getElementById("violationsFound");
  const violationDetailsGroup = document.getElementById(
    "violationDetailsGroup"
  );
  const followUpRequired = document.getElementById("followUpRequired");
  const followUpDateGroup = document.getElementById("followUpDateGroup");

  if (!form) return;
  if (!window.supabase || !SB_URL || !SB_KEY) {
    console.warn("[Supabase] SDK/Config missing");
    return;
  }
  const sb = window.supabase.createClient(SB_URL, SB_KEY);

  // UI dependencies
  function toggleDeps() {
    violationDetailsGroup.style.display =
      violationsFound.value === "minor" || violationsFound.value === "major"
        ? "block"
        : "none";
    followUpDateGroup.style.display =
      followUpRequired.value === "yes" ? "block" : "none";
  }

  // Serialize/restore helpers
  function isSavable(el) {
    if (!el || el.disabled) return false;
    const t = (el.type || "").toLowerCase();
    const tag = (el.tagName || "").toLowerCase();
    if (["button", "submit", "reset", "file"].includes(t)) return false;
    if (tag === "fieldset") return false;
    return Boolean(el.name || el.id);
  }
  const keyOf = (el) => el.name || el.id;

  function serializeForm() {
    const values = {};
    const fields = Array.from(form.elements).filter(isSavable);
    const radioHandled = new Set();
    for (const el of fields) {
      const k = keyOf(el);
      if (!k) continue;
      if (el.type === "radio") {
        if (radioHandled.has(k)) continue;
        radioHandled.add(k);
        const checked = form.querySelector(
          `input[type="radio"][name="${CSS.escape(k)}"]:checked`
        );
        values[k] = checked ? checked.value : "";
      } else if (el.type === "checkbox") {
        values[k] = !!el.checked;
      } else if (el.tagName === "SELECT" && el.multiple) {
        values[k] = Array.from(el.options)
          .filter((o) => o.selected)
          .map((o) => o.value);
      } else {
        values[k] = el.value ?? "";
      }
    }
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
    toggleDeps();
  }

  // Initial load from DB (no default autofill)
  (async function initialLoad() {
    const { data, error } = await sb
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (!error && data && data.data) applyToForm(data.data);
    toggleDeps();
  })();

  // Debounced upsert
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
        data: serializeForm(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb
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
    saveTimer = setTimeout(upsertNow, SAVE_MS);
  }

  // Wire events
  form.addEventListener("input", schedule, true);
  form.addEventListener(
    "change",
    (e) => {
      if (e.target === violationsFound || e.target === followUpRequired)
        toggleDeps();
      schedule();
    },
    true
  );

  // Submit = không post đâu cả, chỉ log & ensure save
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    schedule();
    console.log("[Compliance] submit payload:", serializeForm());
  });

  // Realtime sync
  const ch = sb
    .channel(`realtime:${TABLE}:${ROW_ID}`)
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

  window.addEventListener("beforeunload", () => {
    try {
      sb.removeChannel(ch);
    } catch {}
  });
})();
