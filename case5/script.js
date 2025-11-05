// Wizard 3 bước - Operations Validation
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("operationsForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // UI dependencies
  const transactionType = document.getElementById("transactionType");
  const beneficiarySection = document.getElementById("beneficiarySection");
  const status = document.getElementById("status");
  const failureReasonGroup = document.getElementById("failureReasonGroup");
  const validationResult = document.getElementById("validationResult");
  const validationIssuesGroup = document.getElementById(
    "validationIssuesGroup"
  );
  const fraudIndicators = document.getElementById("fraudIndicators");
  const fraudDetailsGroup = document.getElementById("fraudDetailsGroup");

  // Set default review date
  const reviewDateField = document.getElementById("reviewDate");
  if (reviewDateField && !reviewDateField.value) {
    reviewDateField.value = new Date().toISOString().split("T")[0];
  }

  function applyVisibility() {
    if (beneficiarySection) {
      const tt = transactionType?.value || "";
      beneficiarySection.style.display = tt === "transfer" ? "block" : "none";
    }
    if (failureReasonGroup) {
      const st = status?.value || "";
      failureReasonGroup.style.display =
        st === "failed" || st === "cancelled" ? "block" : "none";
    }
    if (validationIssuesGroup) {
      const vr = validationResult?.value || "";
      const show = ["invalid", "needs-review", "suspicious"].includes(vr);
      validationIssuesGroup.style.display = show ? "block" : "none";
    }
    if (fraudDetailsGroup) {
      const fi = fraudIndicators?.value || "";
      fraudDetailsGroup.style.display = fi && fi !== "none" ? "block" : "none";
    }
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

  // Submit ngay lập tức, không chặn, không hỏi
  form.addEventListener("submit", () => {
    // cho phép submit mặc định
  });

  // Balance calculation
  const balanceBefore = document.getElementById("balanceBefore");
  const balanceAfter = document.getElementById("balanceAfter");
  const transactionAmount = document.getElementById("transactionAmount");

  function calcBalance() {
    if (!balanceBefore || !balanceAfter || !transactionAmount) return;
    const before = parseFloat(balanceBefore.value || "0");
    const after = parseFloat(balanceAfter.value || "0");
    const amount = parseFloat(transactionAmount.value || "0");
    const type = transactionType?.value || "";
    let expectedAfter = before;
    if (["deposit", "refund", "loan-disbursement"].includes(type))
      expectedAfter = before + amount;
    if (
      ["withdrawal", "transfer", "payment", "loan-payment", "fee"].includes(
        type
      )
    )
      expectedAfter = before - amount;
    const balanceStatus = document.getElementById("balanceStatus");
    if (balanceStatus)
      balanceStatus.value =
        Math.abs(after - expectedAfter) < 1 ? "matched" : "mismatched";
  }

  [balanceBefore, balanceAfter, transactionAmount, transactionType].forEach(
    (el) => {
      el && el.addEventListener("change", calcBalance);
    }
  );

  // Wire UI dependency events
  form.addEventListener("change", (e) => {
    if (
      [transactionType, status, validationResult, fraudIndicators].includes(
        e.target
      )
    )
      applyVisibility();
  });

  setStep(1);
  applyVisibility();
});

// ===== Supabase Shared State =====
(function () {
  const FORM_ID = "operationsForm";
  const TABLE = window.__TABLE__ || "operations_forms";
  const ROW_ID = window.__ROW_ID__ || "use-case-5-operations-validation";
  const SB_URL = window.__SB_URL__;
  const SB_KEY = window.__SB_ANON__;
  const SAVE_MS = 300;

  const form = document.getElementById(FORM_ID);
  const clearBtn = document.getElementById("clearBtn");

  if (!form) return;
  if (!window.supabase || !SB_URL || !SB_KEY) {
    console.warn("[Supabase] SDK/Config missing");
    return;
  }
  const sb = window.supabase.createClient(SB_URL, SB_KEY);

  // UI dependencies
  const transactionType = document.getElementById("transactionType");
  const beneficiarySection = document.getElementById("beneficiarySection");
  const status = document.getElementById("status");
  const failureReasonGroup = document.getElementById("failureReasonGroup");
  const validationResult = document.getElementById("validationResult");
  const validationIssuesGroup = document.getElementById(
    "validationIssuesGroup"
  );
  const fraudIndicators = document.getElementById("fraudIndicators");
  const fraudDetailsGroup = document.getElementById("fraudDetailsGroup");

  function applyVisibility() {
    if (beneficiarySection) {
      const tt = transactionType?.value || "";
      beneficiarySection.style.display = tt === "transfer" ? "block" : "none";
    }
    if (failureReasonGroup) {
      const st = status?.value || "";
      failureReasonGroup.style.display =
        st === "failed" || st === "cancelled" ? "block" : "none";
    }
    if (validationIssuesGroup) {
      const vr = validationResult?.value || "";
      const show = ["invalid", "needs-review", "suspicious"].includes(vr);
      validationIssuesGroup.style.display = show ? "block" : "none";
    }
    if (fraudDetailsGroup) {
      const fi = fraudIndicators?.value || "";
      fraudDetailsGroup.style.display = fi && fi !== "none" ? "block" : "none";
    }
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
    const out = {};
    const els = form.querySelectorAll("input, select, textarea");
    const radioGroups = new Set();
    els.forEach((el) => {
      const name = el.name || el.id;
      if (!name) return;
      if (el.type === "radio") {
        if (radioGroups.has(name)) return;
        radioGroups.add(name);
        const checked = form.querySelector(
          `input[type="radio"][name="${CSS.escape(name)}"]:checked`
        );
        out[name] = checked ? checked.value : "";
      } else if (el.type === "checkbox") {
        out[name] = !!el.checked;
      } else if (el.tagName === "SELECT" && el.multiple) {
        out[name] = Array.from(el.options)
          .filter((o) => o.selected)
          .map((o) => o.value);
      } else if (el.type !== "file") {
        out[name] = el.value ?? "";
      }
    });
    return out;
  }

  function restoreAll(obj) {
    if (!obj || typeof obj !== "object") return;
    Object.entries(obj).forEach(([name, value]) => {
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
        nodes.forEach((el) => {
          el.checked = !!value;
        });
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
    applyVisibility();
  }

  // Initial load from DB
  (async () => {
    const { data, error } = await sb
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (!error && data && data.data) restoreAll(data.data);
  })();

  let t = null,
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
    clearTimeout(t);
    t = setTimeout(upsertNow, 300);
  }
  document.addEventListener("input", schedule, true);
  document.addEventListener(
    "change",
    (e) => {
      applyVisibility();
      schedule();
    },
    true
  );
  form.addEventListener("submit", schedule, true);

  const ch = sb
    .channel("realtime:" + TABLE + ":" + ROW_ID)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        if (isLocal || Date.now() - last < 250) return;
        const incoming = payload.new && payload.new.data;
        if (incoming) {
          restoreAll(incoming);
          last = Date.now();
        }
      }
    )
    .subscribe();

  clearBtn?.addEventListener("click", async () => {
    form.reset();
    applyVisibility();
    try {
      isLocal = true;
    } catch {}
    await sb
      .from(TABLE)
      .upsert(
        { id: ROW_ID, data: {}, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    last = Date.now();
    isLocal = false;
  });

  window.addEventListener("beforeunload", () => {
    try {
      sb.removeChannel(ch);
    } catch {}
  });
})();
