class DataTable extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  async render() {
    const retrieveUrl = this.getAttribute('retrieve-url');
    if (!retrieveUrl) {
      this.innerHTML = '<p>Error: retrieve-url attribute is required.</p>';
      return;
    }

    try {
      const response = await fetch(retrieveUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.createTable(data);
    } catch (error) {
      this.innerHTML = `<p>Error fetching data: ${error.message}</p>`;
    }
  }

  formatValue(val) {
    if (val === null || val === undefined) {
      return '';
    }
    if (typeof val === 'object') {
      // If it's an array, join values
      if (Array.isArray(val)) {
        return val.map(v => this.formatValue(v)).join(', ');
      }
      // If it's an object, extract values and join
      return Object.values(val).map(v => this.formatValue(v)).join(', ');
    }
    return String(val);
  }

  createTable(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.innerHTML = '<p>No data to display.</p>';
      return;
    }

    const headers = Object.keys(data[0]);
    let tableHTML = '<table border="1"><thead><tr>';
    
    headers.forEach(header => {
      tableHTML += `<th>${header}</th>`;
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    data.forEach(row => {
      tableHTML += '<tr>';
      headers.forEach(header => {
        tableHTML += `<td>${this.formatValue(row[header])}</td>`;
      });
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    this.innerHTML = tableHTML;
  }
}

customElements.define('data-table', DataTable);
