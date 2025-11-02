// Use Case 1 - Loan Origination Form Script

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loanOriginationForm");
  const clearBtn = document.getElementById("clearBtn");
  const aiTestBtn = document.getElementById("aiTestBtn");

  // Initialize common features
  initializeCommonFeatures(form);

  // Initialize AI Integration
  const formAI = new FormAI("loanOriginationForm");

  // Set default application date to today
  const applicationDateField = document.getElementById("applicationDate");
  applicationDateField.value = new Date().toISOString().split("T")[0];

  // Form submission (giữ validate JS nếu bạn đang dùng)
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateForm(form)) {
      showAlert("Vui lòng kiểm tra lại thông tin đã nhập", "error");
      return;
    }

    const formData = getFormData(form);

    showModal(
      "Xác Nhận Gửi Đơn",
      "Bạn có chắc chắn muốn gửi đơn vay vốn này không?",
      () => {
        // Simulate submission (tùy bạn nối API thật)
        console.log("Submitting loan application:", formData);
        showAlert("Đơn vay đã được gửi thành công!", "success");
        form.reset();
        applicationDateField.value = new Date().toISOString().split("T")[0];
      }
    );
  });

  // Clear button — reset UI ngay lập tức, sau đó wipe trong Supabase (ở block Supabase phía dưới)
  clearBtn.addEventListener("click", function () {
    showModal(
      "Xác Nhận Xóa",
      "Bạn có chắc chắn muốn xóa toàn bộ thông tin đã nhập không?",
      () => {
        formAI.resetForm();
        applicationDateField.value = new Date().toISOString().split("T")[0];
        showAlert("Form đã được xóa", "info");
      }
    );
  });

  // AI Test button - simulates AI filling the form
  aiTestBtn.addEventListener("click", async function () {
    const testData = {
      customerName: "Nguyễn Văn An",
      customerId: "001234567890",
      phoneNumber: "0901234567",
      email: "nguyenvanan@example.com",
      address: "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
      dateOfBirth: "1990-05-15",
      gender: "male",
      loanAmount: "500000000",
      loanTerm: "24",
      loanPurpose: "personal",
      applicationDate: new Date().toISOString().split("T")[0],
      employmentStatus: "employed",
      companyName: "Công ty ABC",
      monthlyIncome: "25000000",
      workAddress: "456 Lê Lợi, Quận 1, TP.HCM",
      collateralType: "real-estate",
      collateralValue: "800000000",
      collateralDescription: "Căn hộ chung cư 80m2 tại Quận 1",
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

  // Format currency inputs on blur
  const currencyInputs = ["loanAmount", "monthlyIncome", "collateralValue"];
  currencyInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    input.addEventListener("blur", function () {
      if (this.value) {
        console.log(`Amount entered: ${formatCurrency(this.value)}`);
      }
    });
  });

  // Update collateral fields — KHÔNG đặt required để đúng yêu cầu "bỏ ràng buộc"
  const collateralType = document.getElementById("collateralType");
  const collateralValue = document.getElementById("collateralValue");
  const collateralDescription = document.getElementById(
    "collateralDescription"
  );

  collateralType.addEventListener("change", function () {
    if (this.value === "none") {
      collateralValue.value = "";
      collateralDescription.value = "";
    } else {
      // Không chèn required
    }
  });
});

// Expose FormAI instance for external AI service integration
window.loanFormAI = null;
document.addEventListener("DOMContentLoaded", function () {
  window.loanFormAI = new FormAI("loanOriginationForm");
});

// ===== Supabase Shared State (kept) =====
(function () {
  const FORM_ID = "loanOriginationForm";
  const form = document.getElementById(FORM_ID);
  if (!form) {
    console.warn("[Supabase] Không tìm thấy form #loanOriginationForm");
    return;
  }

  if (!window.supabase || !window.__SB_URL__ || !window.__SB_ANON__) {
    console.warn("[Supabase] SDK/chìa khóa chưa sẵn sàng");
    return;
  }

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

  // Initial load
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

  // Debounced save
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

  // Realtime updates
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

  // Clear button — reset UI ngay + wipe Supabase (upsert {})
  document.getElementById("clearBtn")?.addEventListener("click", async () => {
    // 1) UI reset ngay lập tức (cho cảm giác real-time)
    form.reset();
    form.querySelectorAll("textarea").forEach((el) => (el.value = ""));
    form.querySelectorAll("select").forEach((el) => {
      if (el.querySelector('option[value=""]')) el.value = "";
    });
    const appDate = document.getElementById("applicationDate");
    if (appDate) appDate.value = new Date().toISOString().split("T")[0];

    // 2) Wipe trong Supabase (row luôn tồn tại nhờ upsert)
    try {
      isLocal = true;
    } catch {}
    await sb.from("forms").upsert(
      {
        id: FORM_ROW_ID,
        data: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    lastApply = Date.now();
    isLocal = false;
    console.log("[Supabase] cleared and UI reset");
  });

  // cleanup khi rời trang
  window.addEventListener("beforeunload", () => {
    try {
      sb.removeChannel(channel);
    } catch {}
  });
})();
// ===== end Supabase Shared State =====
