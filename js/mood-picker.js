// ===== Shared Mood Picker Component =====

class MoodPicker {
  /**
   * @param {Object} opts
   * @param {string} opts.overlayId       - overlay 元素 id
   * @param {string} opts.catRowId        - 分类行容器 id
   * @param {string} opts.feelingsGridId  - 感受网格 id
   * @param {string} opts.backBtnId       - 返回按钮 id
   * @param {string} opts.titleId         - 标题 id
   * @param {string} opts.confirmBtnId    - 确认按钮 id
   * @param {string} opts.titleLabelId    - 步骤2标签 id（可选）
   * @param {string} opts.step1Id         - step1 容器 id
   * @param {string} opts.step2Id         - step2 容器 id
   * @param {Function} opts.onConfirm     - 确认回调 (category: string, feelings: string[]) => void
   */
  constructor(opts) {
    this.opts = opts;
    this.state = {
      selectedCategory: null,
      selectedFeelings: [],
      step: 1,
    };

    // Bind close on overlay click
    const overlay = document.getElementById(opts.overlayId);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }
  }

  /**
   * 打开心情弹窗
   * @param {string|null} initialCategory - 初始分类 id
   * @param {string[]} initialFeelings    - 初始已选感受
   * @param {string} title                - 弹窗标题，默认"记录此刻心情"
   */
  open(initialCategory, initialFeelings, title) {
    this.state.step = 1;
    this.state.selectedCategory = initialCategory || null;
    this.state.selectedFeelings = initialFeelings ? [...initialFeelings] : [];
    this._title = title || '记录此刻心情';

    this._renderStep1();

    document.getElementById(this.opts.overlayId).classList.add('active');
  }

  /** 关闭弹窗 */
  close() {
    document.getElementById(this.opts.overlayId).classList.remove('active');
  }

  // ===== Internal =====

  _renderStep1() {
    this.state.step = 1;

    const backBtn = document.getElementById(this.opts.backBtnId);
    if (backBtn) backBtn.classList.add('hidden');

    const titleEl = document.getElementById(this.opts.titleId);
    if (titleEl) titleEl.textContent = this._title;

    const step1 = document.getElementById(this.opts.step1Id);
    if (step1) step1.style.display = '';

    const step2 = document.getElementById(this.opts.step2Id);
    if (step2) step2.classList.remove('active');

    const row = document.getElementById(this.opts.catRowId);
    if (!row) return;

    row.innerHTML = MOOD_CATEGORIES.map(cat => `
      <div class="mood-cat-item${this.state.selectedCategory === cat.id ? ' selected' : ''}"
           data-cat-id="${cat.id}">
        <span class="mood-cat-icon">${cat.icon}</span>
        <span class="mood-cat-name">${cat.name}</span>
      </div>
    `).join('');

    // Delegate click
    row.onclick = (e) => {
      const item = e.target.closest('.mood-cat-item');
      if (!item) return;
      this._selectCategory(item.dataset.catId);
    };
  }

  _selectCategory(catId) {
    this.state.selectedCategory = catId;
    this.state.selectedFeelings = [];
    this._renderStep2();
  }

  _renderStep2() {
    this.state.step = 2;

    const cat = MOOD_CATEGORIES.find(c => c.id === this.state.selectedCategory);
    if (!cat) return;

    const backBtn = document.getElementById(this.opts.backBtnId);
    if (backBtn) backBtn.classList.remove('hidden');

    const titleEl = document.getElementById(this.opts.titleId);
    if (titleEl) titleEl.textContent = cat.name;

    const step1 = document.getElementById(this.opts.step1Id);
    if (step1) step1.style.display = 'none';

    const step2 = document.getElementById(this.opts.step2Id);
    if (step2) step2.classList.add('active');

    const labelEl = document.getElementById(this.opts.titleLabelId);
    if (labelEl) labelEl.textContent = '选择你的感受（可多选）';

    const grid = document.getElementById(this.opts.feelingsGridId);
    if (!grid) return;

    grid.innerHTML = cat.feelings.map(f => `
      <div class="mood-feeling-chip${this.state.selectedFeelings.includes(f) ? ' selected' : ''}"
           data-feeling="${f}">${f}</div>
    `).join('');

    // Delegate click
    grid.onclick = (e) => {
      const chip = e.target.closest('.mood-feeling-chip');
      if (!chip) return;
      this._toggleFeeling(chip.dataset.feeling);
    };

    this._updateConfirmBtn();
  }

  _toggleFeeling(feeling) {
    const idx = this.state.selectedFeelings.indexOf(feeling);
    if (idx >= 0) {
      this.state.selectedFeelings.splice(idx, 1);
    } else {
      this.state.selectedFeelings.push(feeling);
    }

    // Update chip visuals
    const grid = document.getElementById(this.opts.feelingsGridId);
    if (grid) {
      grid.querySelectorAll('.mood-feeling-chip').forEach(chip => {
        if (chip.dataset.feeling === feeling) {
          chip.classList.toggle('selected', this.state.selectedFeelings.includes(feeling));
        }
      });
    }

    this._updateConfirmBtn();
  }

  _updateConfirmBtn() {
    const btn = document.getElementById(this.opts.confirmBtnId);
    if (btn) btn.disabled = this.state.selectedFeelings.length === 0;
  }

  /** 返回步骤1 */
  back() {
    this._renderStep1();
  }

  /** 确认选择 */
  confirm() {
    if (!this.state.selectedCategory || this.state.selectedFeelings.length === 0) return;

    if (typeof this.opts.onConfirm === 'function') {
      this.opts.onConfirm(this.state.selectedCategory, [...this.state.selectedFeelings]);
    }

    this.close();
  }
}
