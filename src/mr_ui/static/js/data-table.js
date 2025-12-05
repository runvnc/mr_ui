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
        tableHTML += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
      });
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    this.innerHTML = tableHTML;
  }
}

customElements.define('data-table', DataTable);
