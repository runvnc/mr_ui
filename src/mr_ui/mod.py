"""MR UI Components Plugin

Provides:
- Web components for chat UI (data-table, chat-menu)
- Dynamic component creation and serving from /data/ui/
- Pipeline to inject available components into system prompt
"""
import os
import glob
from pathlib import Path
from lib.providers.commands import command
from lib.pipelines.pipe import pipe
from loguru import logger

# Ensure data/ui directory exists
DATA_UI_DIR = "data/ui"
os.makedirs(DATA_UI_DIR, exist_ok=True)


def get_component_list():
    """Get list of available custom components."""
    files = glob.glob(f"{DATA_UI_DIR}/*.js")
    return [Path(f).stem for f in files]


def get_component_info(name: str) -> dict:
    """Get info about a component by reading first comment block."""
    path = f"{DATA_UI_DIR}/{name}.js"
    if not os.path.exists(path):
        return None
    
    with open(path, 'r') as f:
        content = f.read()
    
    # Try to extract description from first comment
    desc = ""
    if content.startswith("/*"):
        end = content.find("*/")
        if end > 0:
            desc = content[2:end].strip()
    elif content.startswith("//"):
        lines = content.split("\n")
        desc_lines = []
        for line in lines:
            if line.startswith("//"):
                desc_lines.append(line[2:].strip())
            else:
                break
        desc = " ".join(desc_lines)
    
    return {"name": name, "description": desc[:200] if desc else "Custom component"}


@pipe(name='filter_messages', priority=7)
async def add_available_components(data: dict, context=None) -> dict:
    """Add list of available custom UI components to system message."""
    try:
        components = get_component_list()
        if not components:
            return data
        
        # Build component list with descriptions
        comp_info = []
        for name in components:
            info = get_component_info(name)
            if info:
                comp_info.append(f"- `<{name}></{name}>`: {info['description']}")
        
        if not comp_info:
            return data
        
        # Format the injection
        ui_section = "\n\n## Custom UI Components (from /data/ui/)\n\n"
        ui_section += "These components are available to embed directly in responses:\n\n"
        ui_section += "\n".join(comp_info)
        ui_section += "\n"
        
        # Add to first message (system message)
        if not data.get('messages') or len(data['messages']) == 0:
            return data
        
        first_msg = data['messages'][0]
        if isinstance(first_msg.get('content'), str):
            first_msg['content'] = first_msg['content'] + ui_section
        elif isinstance(first_msg.get('content'), dict) and first_msg['content'].get('type') == 'text':
            first_msg['content']['text'] = first_msg['content']['text'] + ui_section
        elif isinstance(first_msg.get('content'), list):
            first_msg['content'][0]["text"] += ui_section
        
        data['messages'][0] = first_msg
        return data
        
    except Exception as e:
        logger.error(f"Error in add_available_components pipe: {str(e)}")
        return data


@command()
async def create_component(component_name: str, text: str, context=None) -> dict:
    """Create or update a custom UI web component.
    
    The component JS file will be saved to /data/ui/{component_name}.js and automatically
    loaded on the chat page. You can then use <{component_name}></{component_name}> in responses.
    
    Args:
        component_name: Component name (lowercase with hyphens, e.g. 'customer-list')
        text: The JavaScript code defining the web component
    
    The code should define a class extending HTMLElement and register it:
    
    Example:
    { "create_component": { 
        "component_name": "greeting-card",
        "text": "/* A simple greeting card */\nclass GreetingCard extends HTMLElement {\n  connectedCallback() {\n    const name = this.getAttribute('name') || 'World';\n    this.innerHTML = `<div style='padding:1rem;border:1px solid #444;border-radius:8px;'><h2>Hello, ${name}!</h2></div>`;\n  }\n}\ncustomElements.define('greeting-card', GreetingCard);"
    }}
    
    Then use in responses:
    { "wait_for_user_reply": { "text": "<greeting-card name='User'></greeting-card>" }}
    
    Returns:
        dict: Status and component info
    """
    # Validate component_name (must be valid custom element name)
    if not component_name or not isinstance(component_name, str):
        return {"status": "error", "message": "Name is required"}
    
    component_name = component_name.lower().strip()
    if not '-' in component_name:
        return {"status": "error", "message": "Component name must contain a hyphen (e.g. 'my-component')"}
    
    if not component_name.replace('-', '').isalnum():
        return {"status": "error", "message": "Component name must be alphanumeric with hyphens only"}
    
    # Save the component
    path = f"{DATA_UI_DIR}/{component_name}.js"
    try:
        with open(path, 'w') as f:
            f.write(text)
        
        return {
            "status": "success", 
            "message": f"Component '{component_name}' saved. Use <{component_name}></{component_name}> in responses.",
            "path": path
        }
    except Exception as e:
        logger.error(f"Failed to save component: {str(e)}")
        return {"status": "error", "message": str(e)}


@command()
async def list_components(context=None) -> dict:
    """List all available custom UI components.
    
    Returns:
        dict: List of component names and descriptions
    """
    components = get_component_list()
    result = []
    for name in components:
        info = get_component_info(name)
        if info:
            result.append(info)
    
    return {"components": result}


@command()
async def delete_component(component_name: str, context=None) -> dict:
    """Delete a custom UI component.
    
    Args:
        component_name: The component name to delete
    
    Returns:
        dict: Status of deletion
    """
    path = f"{DATA_UI_DIR}/{component_name}.js"
    if not os.path.exists(path):
        return {"status": "error", "message": f"Component '{component_name}' not found"}
    
    try:
        os.remove(path)
        return {"status": "success", "message": f"Component '{component_name}' deleted"}
    except Exception as e:
        logger.error(f"Failed to delete component: {str(e)}")
        return {"status": "error", "message": str(e)}


@command()
async def read_component(component_name: str, context=None) -> dict:
    """Read the source code of a custom UI component.
    
    Args:
        component_name: The component name to read
    
    Returns:
        dict: Component name and source code
    """
    path = f"{DATA_UI_DIR}/{component_name}.js"
    if not os.path.exists(path):
        return {"status": "error", "message": f"Component '{component_name}' not found"}
    
    try:
        with open(path, 'r') as f:
            content = f.read()
        return {"name": component_name, "text": content}
    except Exception as e:
        logger.error(f"Failed to read component: {str(e)}")
        return {"status": "error", "message": str(e)}
