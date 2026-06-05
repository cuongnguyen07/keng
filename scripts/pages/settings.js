/* ==========================================
   SETTINGS PAGE
   ========================================== */

function renderSettingsPage() {
  const lang = Storage.getSetting('language', 'vi');
  const autoSave = Storage.getSetting('auto_save', true);
  const meetingDefault = Storage.getSetting('meeting_default', false);

  document.getElementById('settings-content').innerHTML = `
    <div class="settings-page">
      <div class="page-header" style="padding-bottom:20px;">
        <div>
          <h1 class="page-title">⚙️ <span class="gradient-text">Cài đặt</span></h1>
          <p class="page-subtitle">Cấu hình và tuỳ chỉnh ứng dụng</p>
        </div>
      </div>

      <div class="settings-body">

        <!-- SPEECH SETTINGS -->
        <div class="settings-section card">
          <div class="settings-section-header">
            <div class="settings-section-icon">🎙️</div>
            <div>
              <div class="settings-section-title">Nhận diện giọng nói</div>
              <div class="settings-section-desc">Cấu hình ngôn ngữ và chế độ ghi âm</div>
            </div>
          </div>
          <div class="settings-section-body">
            <div class="setting-row">
              <label class="setting-label">Ngôn ngữ mặc định</label>
              <select class="select" id="lang-select" style="width:180px;" onchange="saveSetting('language', this.value)">
                <option value="vi" ${lang === 'vi' ? 'selected' : ''}>🇻🇳 Tiếng Việt</option>
                <option value="en" ${lang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
              </select>
            </div>
            <div class="setting-row">
              <div class="flex items-center justify-between">
                <div>
                  <label class="setting-label">Meeting Mode mặc định</label>
                  <p class="setting-hint">Tự động bật phân biệt người nói khi bắt đầu ghi</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="meeting-default-toggle" ${meetingDefault ? 'checked' : ''} onchange="saveSetting('meeting_default', this.checked)" />
                  <div class="toggle-track"><div class="toggle-thumb"></div></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- APP SETTINGS -->
        <div class="settings-section card">
          <div class="settings-section-header">
            <div class="settings-section-icon">📱</div>
            <div>
              <div class="settings-section-title">Ứng dụng</div>
              <div class="settings-section-desc">Tuỳ chỉnh trải nghiệm học tập</div>
            </div>
          </div>
          <div class="settings-section-body">
            <div class="setting-row">
              <div class="flex items-center justify-between">
                <div>
                  <label class="setting-label">Tự động lưu ghi chú</label>
                  <p class="setting-hint">Lưu tự động sau khi dừng ghi âm</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" ${autoSave ? 'checked' : ''} onchange="saveSetting('auto_save', this.checked)" />
                  <div class="toggle-track"><div class="toggle-thumb"></div></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- DATA MANAGEMENT -->
        <div class="settings-section card">
          <div class="settings-section-header">
            <div class="settings-section-icon">💾</div>
            <div>
              <div class="settings-section-title">Dữ liệu</div>
              <div class="settings-section-desc">Quản lý dữ liệu lưu trữ cục bộ</div>
            </div>
          </div>
          <div class="settings-section-body">
            <div class="setting-row">
              <div class="flex gap-3 flex-wrap">
                <button class="btn btn-secondary btn-sm" onclick="exportAllNotes()">📦 Xuất tất cả ghi chú</button>
                <button class="btn btn-danger btn-sm" onclick="clearAllData()">🗑️ Xóa toàn bộ dữ liệu</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  injectSettingsStyles();
}

function saveSetting(key, value) {
  Storage.saveSetting(key, value);
  showToast('✓ Đã lưu cài đặt', 'info');
}

function exportAllNotes() {
  const notes = Storage.getNotes();
  if (notes.length === 0) { showToast('Chưa có ghi chú để xuất', 'info'); return; }
  let content = `# Voice Helper — Tất cả ghi chú\nXuất lúc: ${new Date().toLocaleString('vi-VN')}\n\n`;
  notes.forEach(n => {
    content += `---\n# ${n.title}\n**Ngày:** ${new Date(n.createdAt).toLocaleDateString('vi-VN')} | **Thời lượng:** ${n.duration || '00:00'}\n\n`;
    content += `## Nội dung\n${n.transcript||''}\n\n`;
    if (n.summary) content += `## Tóm tắt\n${n.summary}\n\n`;
  });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'voice-helper-all-notes.md'; a.click();
  URL.revokeObjectURL(url);
  showToast('📦 Đã xuất tất cả ghi chú!', 'success');
}

function clearAllData() {
  if (!confirm('Xóa TẤT CẢ dữ liệu? Hành động này KHÔNG THỂ hoàn tác!')) return;
  localStorage.clear();
  localStorage.setItem('vh_data_seeded', 'true');
  showToast('🗑️ Đã xóa toàn bộ dữ liệu. Đang làm mới trang...', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function injectSettingsStyles() {
  if (document.getElementById('settings-styles')) return;
  const s = document.createElement('style');
  s.id = 'settings-styles';
  s.textContent = `
    .settings-page { padding-bottom: 40px; }
    .settings-body { padding: 0 32px; display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
    @media (max-width:768px) { .settings-body { padding: 0 16px; } }
    .settings-section { padding: 0; }
    .settings-section-header { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }
    .settings-section-icon { font-size: 1.3rem; margin-top: 2px; }
    .settings-section-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
    .settings-section-desc { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }
    .settings-section-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 16px; }
    .setting-row { display: flex; flex-direction: column; gap: 8px; }
    .setting-label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .setting-hint { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }
    .setting-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .api-key-wrap { display: flex; gap: 8px; }
    .api-key-wrap .input { flex: 1; font-family: monospace; letter-spacing: 0.05em; }
    .tech-grid { display: flex; flex-direction: column; gap: 12px; }
    .tech-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px; background: var(--bg-elevated); border-radius: var(--radius-md); }
    .tech-badge { padding: 4px 10px; background: rgba(124,58,237,0.15); color: var(--accent-violet); border: 1px solid rgba(124,58,237,0.25); border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
    .tech-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
  `;
  document.head.appendChild(s);
}
