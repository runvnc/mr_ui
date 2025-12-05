"""Router for serving custom UI components from /data/ui/"""
import os
import glob
from pathlib import Path
from fastapi import APIRouter, Response
from fastapi.responses import FileResponse

router = APIRouter()

DATA_UI_DIR = "data/ui"


@router.get("/components/{name}.js")
async def get_component(name: str):
    """Serve a custom component JS file."""
    # Sanitize name
    name = name.replace('/', '').replace('\\', '').replace('..', '')
    path = f"{DATA_UI_DIR}/{name}.js"
    
    if not os.path.exists(path):
        return Response(f"// Component '{name}' not found", status_code=404, media_type="application/javascript")
    
    return FileResponse(path, media_type="application/javascript")


@router.get("/components/all.js")
async def get_all_components():
    """Serve all custom components concatenated into a single JS file."""
    files = glob.glob(f"{DATA_UI_DIR}/*.js")
    
    if not files:
        return Response("// No custom components available", media_type="application/javascript")
    
    # Concatenate all component files
    content = "// Auto-generated bundle of all custom UI components\n"
    content += "// Components from /data/ui/\n\n"
    
    for f in files:
        name = Path(f).stem
        try:
            with open(f, 'r') as file:
                component_code = file.read()
            content += f"// === Component: {name} ===\n"
            content += component_code
            content += "\n\n"
        except Exception as e:
            content += f"// Error loading {name}: {e}\n\n"
    
    return Response(content, media_type="application/javascript")


@router.get("/api/components")
async def list_components_api():
    """API endpoint to list available components."""
    files = glob.glob(f"{DATA_UI_DIR}/*.js")
    components = []
    
    for f in files:
        name = Path(f).stem
        # Read first line for description
        desc = ""
        try:
            with open(f, 'r') as file:
                first_line = file.readline()
                if first_line.startswith("/*"):
                    # Multi-line comment
                    content = first_line + file.read()
                    end = content.find("*/")
                    if end > 0:
                        desc = content[2:end].strip()
                elif first_line.startswith("//"):
                    desc = first_line[2:].strip()
        except:
            pass
        
        components.append({
            "name": name,
            "tag": f"<{name}></{name}>",
            "description": desc[:200] if desc else "Custom component"
        })
    
    return {"components": components}
