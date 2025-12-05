class DataTable extends HTMLElement {
  constructor() {
    super();
    this.data = [];
    this.selectedRow = null;
    this.showingDetail = false;
  }

  connectedCallback() {
    this.render();
  }

  async render() {
    const retrieveUrl = this.getAttribute('retrieve-url');
    if (!retrieveUrl) {
      this.innerHTML = '<p>Error: retrieve-url attribute is required.</p>';
      return;
    }

    this.innerHTML = '<p>Loading...</p>';

    try {
      const response = await fetch(retrieveUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.showTable();
    } catch (error) {
      this.innerHTML = `<p>Error fetching data: ${error.message}</p>`;
    }
  }

  getColumns() {
    const columnsAttr = this.getAttribute('columns');
    if (columnsAttr) {
      return columnsAttr.split(',').map(c => c.trim());
    }
    // Default: all columns from first row
    if (this.data.length > 0) {
      return Object.keys(this.data[0]);
    }
    return [];
  }

  getIdField() {
    return this.getAttribute('id-field') || 'id';
  }

  formatValue(val) {
    if (val === null || val === undefined) {
      return '';
    }
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return val.map(v => this.formatValue(v)).join(', ');
      }
      return Object.values(val).map(v => this.formatValue(v)).join(', ');
    }
    return String(val);
  }

  showTable() {
    this.showingDetail = false;
    this.selectedRow = null;

    if (!Array.isArray(this.data) || this.data.length === 0) {
      this.innerHTML = '<p>No data to display.</p>';
      return;
    }

    const columns = this.getColumns();
    const idField = this.getIdField();

    let html = `
      <div class="data-table-container">
        <div class="data-table-toolbar">
          <button class="dt-refresh-btn" title="Refresh">↻ Refresh</button>
        </div>
        <table class="data-table-main">
          <thead><tr>`;
    
    columns.forEach(col => {
      html += `<th>${col}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    this.data.forEach((row, idx) => {
      const rowId = row[idField] !== undefined ? row[idField] : idx;
      html += `<tr class="dt-row" data-row-idx="${idx}" data-row-id="${rowId}">`;
      columns.forEach(col => {
        html += `<td>${this.formatValue(row[col])}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    this.innerHTML = html;

    // Add styles
    this.addStyles();

    // Bind events
    this.querySelector('.dt-refresh-btn').addEventListener('click', () => this.render());
    this.querySelectorAll('.dt-row').forEach(row => {
      row.addEventListener('click', (e) => this.handleRowClick(e));
    });
  }

  async handleRowClick(e) {
    const row = e.target.closest('.dt-row');
    const idx = parseInt(row.dataset.rowIdx);
    const rowId = row.dataset.rowId;
    const rowData = this.data[idx];

    const detailUrl = this.getAttribute('detail-url');
    
    if (detailUrl) {
      // Fetch detail data from URL (replace {id} placeholder)
      const url = detailUrl.replace('{id}', rowId);
      try {
        const response = await fetch(url);
        if (response.ok) {
          const detailData = await response.json();
          this.showDetail(detailData);
          return;
        }
      } catch (error) {
        console.error('Error fetching detail:', error);
      }
    }
    
    // No detail URL or fetch failed - show row data
    this.showDetail(rowData);
  }

  showDetail(data) {
    this.showingDetail = true;
    
    let html = `
      <div class="data-table-container">
        <div class="data-table-toolbar">
          <button class="dt-back-btn">← Back</button>
          <button class="dt-refresh-btn" title="Refresh">↻ Refresh</button>
        </div>
        <div class="dt-detail-view">`;
    
    Object.entries(data).forEach(([key, val]) => {
      html += `
        <div class="dt-detail-row">
          <label class="dt-detail-label">${key}</label>
          <div class="dt-detail-value">${this.formatValue(val)}</div>
        </div>`;
    });
    
    html += '</div></div>';
    this.innerHTML = html;

    this.addStyles();

    this.querySelector('.dt-back-btn').addEventListener('click', () => this.showTable());
    this.querySelector('.dt-refresh-btn').addEventListener('click', () => this.render());
  }

  addStyles() {
    if (this.querySelector('style')) return;
    
    const style = document.createElement('style');
    style.textContent = `
      .data-table-container {
        font-family: system-ui, sans-serif;
      }
      .data-table-toolbar {
        margin-bottom: 8px;
        display: flex;
        gap: 8px;
      }
      .data-table-toolbar button {
        padding: 6px 12px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        background: rgba(40,40,60,0.8);
        color: #fff;
        cursor: pointer;
      }
      .data-table-toolbar button:hover {
        background: rgba(60,60,90,0.9);
      }
      .data-table-main {
        width: 100%;
        border-collapse: collapse;
        background: rgba(20,20,35,0.9);
      }
      .data-table-main th, .data-table-main td {
        padding: 8px 12px;
        text-align: left;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .data-table-main th {
        background: rgba(40,40,60,0.8);
        font-weight: 600;
      }
      .dt-row {
        cursor: pointer;
        transition: background 0.15s;
      }
      .dt-row:hover {
        background: rgba(60,60,90,0.5);
      }
      .dt-detail-view {
        background: rgba(20,20,35,0.9);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px;
        padding: 16px;
      }
      .dt-detail-row {
        display: flex;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .dt-detail-row:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      .dt-detail-label {
        font-weight: 600;
        width: 150px;
        flex-shrink: 0;
        color: rgba(255,255,255,0.7);
      }
      .dt-detail-value {
        flex: 1;
      }
    `;
    this.prepend(style);
  }
}

customElements.define('data-table', DataTable);
