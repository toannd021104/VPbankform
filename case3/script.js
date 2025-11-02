// Use Case 3 - HR Workflow Form Script

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('hrWorkflowForm');
  const clearBtn = document.getElementById('clearBtn');
  const aiTestBtn = document.getElementById('aiTestBtn');
  
  // Initialize common features
  initializeCommonFeatures(form);
  
  // Initialize AI Integration
  const formAI = new FormAI('hrWorkflowForm');
  
  // Set default submission date to today
  const submissionDateField = document.getElementById('submissionDate');
  submissionDateField.value = new Date().toISOString().split('T')[0];
  
  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm(form)) {
      showAlert('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
      return;
    }
    
    const formData = getFormData(form);
    
    showModal(
      'Xác Nhận Gửi Đơn',
      'Bạn có chắc chắn muốn gửi đơn này không?',
      () => {
        // Simulate submission
        console.log('Submitting HR request:', formData);
        showAlert('Đơn đã được gửi thành công!', 'success');
        clearFormDraft('hrWorkflowForm');
        form.reset();
        submissionDateField.value = new Date().toISOString().split('T')[0];
      }
    );
  });
  
  // Clear button
  clearBtn.addEventListener('click', function() {
    showModal(
      'Xác Nhận Xóa',
      'Bạn có chắc chắn muốn xóa toàn bộ thông tin đã nhập không?',
      () => {
        formAI.resetForm();
        submissionDateField.value = new Date().toISOString().split('T')[0];
        showAlert('Form đã được xóa', 'info');
      }
    );
  });
  
  // AI Test button - simulates AI filling the form
  aiTestBtn.addEventListener('click', async function() {
    // Example: "Tạo đơn nghỉ phép từ 22 đến 24 tháng 10, lý do cá nhân"
    const today = new Date();
    const testData = {
      employeeName: 'Nguyễn Văn Cường',
      employeeId: 'EMP12345',
      department: 'customer-service',
      position: 'Chuyên viên CSKH',
      email: 'nguyen.cuong@vpbank.com.vn',
      phoneNumber: '0923456789',
      requestType: 'leave',
      leaveType: 'personal',
      startDate: `${today.getFullYear()}-10-22`,
      endDate: `${today.getFullYear()}-10-24`,
      reason: 'Lý do cá nhân',
      managerName: 'Trần Thị Lan',
      managerEmail: 'tran.lan@vpbank.com.vn',
      approvalStatus: 'pending',
      submissionDate: new Date().toISOString().split('T')[0]
    };
    
    const result = formAI.fillForm(testData);
    
    if (result.success) {
      showAlert(`AI đã điền thành công ${result.filledFields.length} trường`, 'success');
      calculateDuration(); // Calculate duration after filling dates
    } else {
      showAlert('Có lỗi khi AI điền form', 'error');
      console.error('AI Fill errors:', result.errors);
    }
  });
  
  // Request type change handler
  const requestType = document.getElementById('requestType');
  const leaveTypeGroup = document.getElementById('leaveTypeGroup');
  const leaveType = document.getElementById('leaveType');
  
  requestType.addEventListener('change', function() {
    if (this.value === 'leave') {
      leaveTypeGroup.style.display = 'block';
      leaveType.required = true;
    } else {
      leaveTypeGroup.style.display = 'none';
      leaveType.required = false;
      leaveType.value = '';
    }
  });
  
  // Approval status change handler
  const approvalStatus = document.getElementById('approvalStatus');
  const rejectionReasonGroup = document.getElementById('rejectionReasonGroup');
  const rejectionReason = document.getElementById('rejectionReason');
  
  approvalStatus.addEventListener('change', function() {
    if (this.value === 'rejected') {
      rejectionReasonGroup.style.display = 'block';
      rejectionReason.required = true;
    } else {
      rejectionReasonGroup.style.display = 'none';
      rejectionReason.required = false;
      rejectionReason.value = '';
    }
  });
  
  // Calculate duration between start and end dates
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const duration = document.getElementById('duration');
  
  function calculateDuration() {
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        duration.value = diffDays;
      } else {
        duration.value = '';
        showAlert('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      }
    }
  }
  
  startDate.addEventListener('change', calculateDuration);
  endDate.addEventListener('change', calculateDuration);
  
  // Validate end date is after start date
  endDate.addEventListener('change', function() {
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      
      if (end < start) {
        const formGroup = endDate.closest('.form-group');
        formGroup.classList.add('error');
        const errorMessage = formGroup.querySelector('.error-message');
        errorMessage.textContent = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
  });
});

// Expose FormAI instance for external AI service integration
window.hrFormAI = null;
document.addEventListener('DOMContentLoaded', function() {
  window.hrFormAI = new FormAI('hrWorkflowForm');
});

// === Shared State Sync (Supabase) — Case 3 HR Workflow ===
(function() {
  if (typeof window === 'undefined') return;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[Supabase] SDK not loaded.');
    return;
  }
  const SB_URL  = window.__SB_URL__;
  const SB_ANON = window.__SB_ANON__;
  const TABLE   = window.__TABLE__ || 'hr_forms';
  const ROW_ID  = window.__ROW_ID__ || 'use-case-3-hr-workflow';
  const client  = window.supabase.createClient(SB_URL, SB_ANON);

  // Prefer #hrWorkflowForm; fallback to first <form>
  let form = document.getElementById('hrWorkflowForm') || document.querySelector('form');
  if (!form) { console.warn('[Supabase] No form found'); return; }

  function serializeAll() {
    const data = {};
    const fields = form.querySelectorAll('input, select, textarea');
    const radioGroupsHandled = new Set();
    fields.forEach((el) => {
      const name = el.name || el.id;
      if (!name) return;
      if (el.type === 'radio') {
        if (radioGroupsHandled.has(name)) return;
        radioGroupsHandled.add(name);
        const checked = form.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
        data[name] = checked ? checked.value : '';
      } else if (el.type === 'checkbox') {
        data[name] = !!el.checked;
      } else if (el.type === 'file') {
        data[name] = '';
      } else {
        data[name] = el.value ?? '';
      }
    });
    return data;
  }

  function applyToForm(data) {
    if (!data || typeof data !== 'object') return;
    Object.entries(data).forEach(([name, value]) => {
      const nodes = form.querySelectorAll(`[name="${CSS.escape(name)}"], #${CSS.escape(name)}`);
      if (!nodes.length) return;
      const first = nodes[0];
      if (first.type === 'radio') {
        nodes.forEach((el) => { el.checked = (el.value === value); });
      } else if (first.type === 'checkbox') {
        nodes.forEach((el) => el.checked = !!value);
      } else if (first.tagName === 'SELECT') {
        first.value = value ?? '';
      } else if (first.type !== 'file') {
        nodes.forEach((el) => el.value = value ?? '');
      }
    });
  }

  let saveTimer = null;
  let isLocal = false;
  let last = 0;

  async function upsertNow() {
    try { isLocal = true; } catch {};
    try {
      const payload = { id: ROW_ID, data: serializeAll(), updated_at: new Date().toISOString() };
      const { error } = await client.from(TABLE).upsert(payload, { onConflict: 'id' });
      if (error) console.error('[Supabase] upsert error:', error);
      last = Date.now();
    } finally {
      isLocal = false;
    }
  }
  function schedule() { clearTimeout(saveTimer); saveTimer = setTimeout(upsertNow, 300); }

  form.addEventListener('input', schedule, true);
  form.addEventListener('change', schedule, true);
  form.addEventListener('submit', () => schedule(), true);

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const { error } = await client.from(TABLE).upsert({ id: ROW_ID, data: {}, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) console.error('[Supabase] clear error:', error);
    }, true);
  }

  (async function initialLoad() {
    const { data, error } = await client.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
    if (!error && data && data.data) {
      applyToForm(data.data);
      last = Date.now();
    }
  })();

  const ch = client
    .channel('realtime:'+TABLE+':'+ROW_ID)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` }, (payload) => {
      if (isLocal || (Date.now() - last) < 250) return;
      const incoming = payload.new && payload.new.data;
      if (incoming) { applyToForm(incoming); last = Date.now(); }
    })
    .subscribe();

  window.addEventListener('beforeunload', () => { try { client.removeChannel(ch); } catch {} });
})();
// === End Shared State Sync ===
