class ChatMenu extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    // Get menu items from child elements
    const items = Array.from(this.querySelectorAll('menu-item'));
    
    // Create container
    const container = document.createElement('div');
    container.className = 'chat-menu';
    
    // Style the container
    container.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px;
    `;
    
    items.forEach(item => {
      const text = item.getAttribute('text') || item.textContent.trim();
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.className = 'chat-menu-btn';
      btn.style.cssText = `
        padding: 8px 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(40, 40, 60, 0.8);
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
      `;
      
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(60, 60, 90, 0.9)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(40, 40, 60, 0.8)';
      });
      
      btn.addEventListener('click', () => {
        if (window.sendChat) {
          window.sendChat(text);
        } else {
          console.warn('window.sendChat not available');
        }
      });
      
      container.appendChild(btn);
    });
    
    // Clear and append
    this.innerHTML = '';
    this.appendChild(container);
  }
}

customElements.define('chat-menu', ChatMenu);
