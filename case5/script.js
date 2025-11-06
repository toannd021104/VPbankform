// Wizard 3 bước — không modal, không required, hành động tức thì
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("operationsForm");
  const panes = Array.from(document.querySelectorAll(".wizard-step-pane"));
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const barFill = document.querySelector(".wizard-bar-fill");
  const clearBtn = document.getElementById("clearBtn");

  // Đặt ngày kiểm tra mặc định = hôm nay nếu trống
  const reviewDateField = document.getElementById("reviewDate");
  if (reviewDateField && !reviewDateField.value) {
    reviewDateField.value = new Date().toISOString().split("T")[0];
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
      if (reviewDateField)
        reviewDateField.value = new Date().toISOString().split("T")[0];

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
    showToast("✓ Yêu cầu đã được tiếp nhận");

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
  const FORM_ID = "operationsForm";
  const form = document.getElementById(FORM_ID);
  if (!form) return;

  if (!window.supabase || !window.__SB_URL__ || !window.__SB_ANON__) return;

  const sb = window.supabase.createClient(
    window.__SB_URL__,
    window.__SB_ANON__
  );
  const FORM_ROW_ID = window.__ROW_ID__ || "use-case-5-operations-validation";
  const TABLE_NAME = window.__TABLE__ || "operations_forms";

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
      } else if (el.type !== "file") {
        data[name] = el.value ?? "";
      }
    });
    return data;
  }

  function restoreAll(saved) {
    if (!saved || typeof saved !== "object") return;
    Object.entries(saved).forEach(([fieldName, value]) => {
      const control = form.querySelector(
        `input[name="${CSS.escape(fieldName)}"], select[name="${CSS.escape(
          fieldName
        )}"], textarea[name="${CSS.escape(fieldName)}"], #${CSS.escape(
          fieldName
        )}`
      );
      if (!control) return;
      if (control.type === "radio") {
        form
          .querySelectorAll(
            `input[type="radio"][name="${CSS.escape(fieldName)}"]`
          )
          .forEach((r) => {
            r.checked = r.value === value;
          });
      } else if (control.type === "checkbox") {
        control.checked = !!value;
      } else {
        control.value = value ?? "";
      }
    });
  }

  // Load on start
  (async () => {
    try {
      const { data } = await sb
        .from(TABLE_NAME)
        .select("data")
        .eq("id", FORM_ROW_ID)
        .maybeSingle();
      if (data && data.data) restoreAll(data.data);
    } catch (err) {
      console.error("[Supabase] Load error:", err);
    }
  })();

  // Auto-save on change
  let timer = null;
  const delay = 300;
  form.addEventListener("change", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await sb.from(TABLE_NAME).upsert(
          {
            id: FORM_ROW_ID,
            data: serializeAll(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.error("[Supabase] Save error:", err);
      }
    }, delay);
  });

  // Realtime sync
  const channel = sb
    .channel(`${TABLE_NAME}:${FORM_ROW_ID}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLE_NAME,
        filter: `id=eq.${FORM_ROW_ID}`,
      },
      (payload) => {
        if (payload.new && payload.new.data) {
          restoreAll(payload.new.data);
        }
      }
    )
    .subscribe();

  // Cleanup
  window.addEventListener("beforeunload", () => {
    channel.unsubscribe();
  });
})();
