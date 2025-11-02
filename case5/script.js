// Use Case 5 - Operations Validation (no localStorage, no required, clear without modal)
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('operationsForm');
  const clearBtn = document.getElementById('clearBtn');
  const aiTestBtn = document.getElementById('aiTestBtn');

  try { initializeCommonFeatures?.(form); } catch {}
  try { window.operationsFormAI = new FormAI('operationsForm'); } catch {}

  const reviewDateField = document.getElementById('reviewDate');
  if (reviewDateField && !reviewDateField.value) {
    reviewDateField.value = new Date().toISOString().split('T')[0];
  }

  const transactionType = document.getElementById('transactionType');
  const beneficiarySection = document.getElementById('beneficiarySection');
  const status = document.getElementById('status');
  const failureReasonGroup = document.getElementById('failureReasonGroup');
  const validationResult = document.getElementById('validationResult');
  const validationIssuesGroup = document.getElementById('validationIssuesGroup');
  const fraudIndicators = document.getElementById('fraudIndicators');
  const fraudDetailsGroup = document.getElementById('fraudDetailsGroup');

  function applyVisibility() {
    if (beneficiarySection) {
      const tt = transactionType?.value || '';
      beneficiarySection.style.display = (tt === 'transfer') ? 'block' : 'none';
    }
    if (failureReasonGroup) {
      const st = status?.value || '';
      failureReasonGroup.style.display = (st === 'failed' || st === 'cancelled') ? 'block' : 'none';
    }
    if (validationIssuesGroup) {
      const vr = validationResult?.value || '';
      const show = ['invalid','needs-review','suspicious'].includes(vr);
      validationIssuesGroup.style.display = show ? 'block' : 'none';
    }
    if (fraudDetailsGroup) {
      const fi = fraudIndicators?.value || '';
      fraudDetailsGroup.style.display = (fi && fi !== 'none') ? 'block' : 'none';
    }
  }
  applyVisibility();

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    try {
      if (typeof validateForm === 'function' && !validateForm(form)) {
        showAlert?.('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
        return;
      }
    } catch {}
    const data = (typeof getFormData === 'function') ? getFormData(form) : null;
    console.log('Submitting transaction validation:', data);
    showAlert?.('Kết quả kiểm tra đã được lưu!', 'success');
  });

  const balanceBefore = document.getElementById('balanceBefore');
  const balanceAfter = document.getElementById('balanceAfter');
  const transactionAmount = document.getElementById('transactionAmount');
  function calcBalance() {
    if (!balanceBefore || !balanceAfter || !transactionAmount) return;
    const before = parseFloat(balanceBefore.value || '0');
    const after  = parseFloat(balanceAfter.value || '0');
    const amount = parseFloat(transactionAmount.value || '0');
    const type   = transactionType?.value || '';
    let expectedAfter = before;
    if (['deposit','refund','loan-disbursement'].includes(type)) expectedAfter = before + amount;
    if (['withdrawal','transfer','payment','loan-payment','fee'].includes(type)) expectedAfter = before - amount;
    const balanceStatus = document.getElementById('balanceStatus');
    if (balanceStatus) balanceStatus.value = (Math.abs(after - expectedAfter) < 1) ? 'matched' : 'mismatched';
  }
  [balanceBefore, balanceAfter, transactionAmount, transactionType].forEach(el => { el && el.addEventListener('change', calcBalance); });

  // ===== Supabase Shared State =====
  const SB = window.supabase;
  const SB_URL = window.__SB_URL__, SB_ANON = window.__SB_ANON__;
  const TABLE = window.__TABLE__ || 'operations_forms';
  const ROW_ID = window.__ROW_ID__ || 'use-case-5-operations-validation';
  if (!SB || !SB_URL || !SB_ANON) { console.warn('[Supabase] SDK/config missing'); return; }
  const sb = SB.createClient(SB_URL, SB_ANON);

  function serializeAll() {
    const out = {};
    const els = form.querySelectorAll('input, select, textarea');
    const radioGroups = new Set();
    els.forEach(el => {
      const name = el.name || el.id; if (!name) return;
      if (el.type === 'radio') {
        if (radioGroups.has(name)) return;
        radioGroups.add(name);
        const checked = form.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
        out[name] = checked ? checked.value : '';
      } else if (el.type === 'checkbox') {
        out[name] = !!el.checked;
      } else if (el.tagName === 'SELECT' && el.multiple) {
        out[name] = Array.from(el.options).filter(o=>o.selected).map(o=>o.value);
      } else if (el.type !== 'file') {
        out[name] = el.value ?? '';
      }
    });
    return out;
  }

  function restoreAll(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.entries(obj).forEach(([name, value]) => {
      const nodes = form.querySelectorAll(`[name="${CSS.escape(name)}"], #${CSS.escape(name)}`);
      if (!nodes.length) return;
      const first = nodes[0];
      if (first.type === 'radio') {
        nodes.forEach(el => { el.checked = el.value === value; });
      } else if (first.type === 'checkbox') {
        nodes.forEach(el => { el.checked = !!value; });
      } else if (first.tagName === 'SELECT') {
        if (first.multiple && Array.isArray(value)) {
          Array.from(first.options).forEach(opt => opt.selected = value.includes(opt.value));
        } else {
          first.value = value ?? '';
        }
      } else if (first.type !== 'file') {
        nodes.forEach(el => el.value = value ?? '');
      }
    });
    applyVisibility();
  }

  (async () => {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
    if (!error && data && data.data) restoreAll(data.data);
  })();

  let t = null, isLocal = false, last = 0;
  async function upsertNow() {
    try { isLocal = true } catch {}
    try {
      const payload = { id: ROW_ID, data: serializeAll(), updated_at: new Date().toISOString() };
      const { error } = await sb.from(TABLE).upsert(payload, { onConflict: 'id' });
      if (error) console.error('[Supabase] upsert error:', error);
      last = Date.now();
    } finally { isLocal = false; }
  }
  function schedule() { clearTimeout(t); t = setTimeout(upsertNow, 300); }
  document.addEventListener('input', schedule, true);
  document.addEventListener('change', (e)=>{ applyVisibility(); schedule(); }, true);
  form.addEventListener('submit', schedule, true);

  const ch = sb.channel('realtime:'+TABLE+':'+ROW_ID)
    .on('postgres_changes', { event:'*', schema:'public', table:TABLE, filter:`id=eq.${ROW_ID}` }, (payload) => {
      if (isLocal || Date.now() - last < 250) return;
      const incoming = payload.new && payload.new.data;
      if (incoming) { restoreAll(incoming); last = Date.now(); }
    })
    .subscribe();

  clearBtn?.addEventListener('click', async () => {
    form.reset();
    applyVisibility();
    try { isLocal = true } catch {}
    await sb.from(TABLE).upsert({ id: ROW_ID, data: {}, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    last = Date.now();
    isLocal = false;
  });

  window.addEventListener('beforeunload', () => { try { sb.removeChannel(ch); } catch {} });
});
