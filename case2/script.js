// Wizard 3 bước - CRM Update Form
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("crmUpdateForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // Set default date and time
  const interactionDateField = document.getElementById("interactionDate");
  const interactionTimeField = document.getElementById("interactionTime");

  if (interactionDateField && !interactionDateField.value) {
    interactionDateField.value = new Date().toISOString().split("T")[0];
  }

  if (interactionTimeField && !interactionTimeField.value) {
    const now = new Date();
    interactionTimeField.value = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  // Follow-up UX
  const followUpRequired = document.getElementById("followUpRequired");
  const followUpDate = document.getElementById("followUpDate");

  function handleFollowUp() {
    if (followUpRequired?.value === "yes" && followUpDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      followUpDate.value = nextWeek.toISOString().split("T")[0];
    } else if (followUpDate) {
      followUpDate.value = "";
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
  });

  // Submit ngay lập tức, không chặn, không hỏi
  form.addEventListener("submit", () => {
    // cho phép submit mặc định
  });

  // Wire follow-up event
  if (followUpRequired) {
    followUpRequired.addEventListener("change", handleFollowUp);
  }

  setStep(1);
});

// ===== Supabase Shared State =====
(function () {
  const FORM_ID = "crmUpdateForm";
  const TABLE = window.__TABLE__ || "crm_forms";
  const ROW_ID = window.__ROW_ID__ || "vpbank_crm_update_shared_form";
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

  // Follow-up UX
  const followUpRequired = document.getElementById("followUpRequired");
  const followUpDate = document.getElementById("followUpDate");

  function handleFollowUp() {
    if (followUpRequired?.value === "yes" && followUpDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      followUpDate.value = nextWeek.toISOString().split("T")[0];
    } else if (followUpDate) {
      followUpDate.value = "";
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
    const values = {};
    const fields = Array.from(form.elements).filter(isSavable);
    const radioHandled = new Set();

    fields.forEach((el) => {
      const k = keyOf(el);
      if (!k) return; // Sửa từ 'continue' thành 'return' cho forEach

      if (el.type === "radio") {
        if (radioHandled.has(k)) return;
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
    handleFollowUp();
  }

  // Initial load from DB
  (async function initialLoad() {
    const { data, error } = await sb
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (!error && data && data.data) applyToForm(data.data);
    handleFollowUp();
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
      if (e.target === followUpRequired) handleFollowUp();
      schedule();
    },
    true
  );

  // Submit = không post đâu cả, chỉ log & ensure save
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    schedule();
    console.log("[CRM] submit payload:", serializeForm());
  });

  // Clear = reset UI + wipe DB (no modal)
  clearBtn?.addEventListener("click", async () => {
    form.reset();

    // Reset về step 1
    const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
    const steps = Array.from(document.querySelectorAll(".wizard-step"));
    const barFill = document.querySelector(".wizard-bar-fill");

    panes.forEach((p, index) => {
      p.classList.toggle("is-hidden", index !== 0);
    });
    steps.forEach((s, index) => {
      s.classList.toggle("is-active", index === 0);
      s.classList.toggle("is-done", false);
    });
    if (barFill) barFill.style.width = "33%";

    // Set default date and time
    const interactionDateField = document.getElementById("interactionDate");
    const interactionTimeField = document.getElementById("interactionTime");

    if (interactionDateField) {
      interactionDateField.value = new Date().toISOString().split("T")[0];
    }

    if (interactionTimeField) {
      const now = new Date();
      interactionTimeField.value = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    handleFollowUp();

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
