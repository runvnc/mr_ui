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


@router.get("/components/loader.js")
async def get_loader():
    """Generate a JS module that imports all available components."""
    files = glob.glob(f"{DATA_UI_DIR}/*.js")
    
    if not files:
        return Response("// No custom components available", media_type="application/javascript")
    
    # Generate import statements
    imports = []
    for f in files:
        name = Path(f).stem
        imports.append(f"import '/mr_ui/components/{name}.js';")
    
    content = "// Auto-generated loader for custom UI components\n"
    content += "// Components from /data/ui/\n\n"
    content += "\n".join(imports)
    
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
