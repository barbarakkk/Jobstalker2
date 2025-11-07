import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

# First check if environment variables are already set (production/Docker)
# Only load from .env files if not already set (local development)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SERVICE_KEY")
    or os.getenv("SUPABASE_KEY")
)

# If not set, try loading from .env files (for local development)
loaded_any = False
loaded_from: list[str] = []
if not SUPABASE_URL or not SUPABASE_KEY:
    # Load environment variables from .env files robustly, regardless of CWD
    # 1) backend/.env (same dir as this file)
    # 2) repo root .env (parent of backend)
    # 3) any .env found via find_dotenv (uses current working directory)
    backend_env = Path(__file__).with_name('.env')
    root_env = Path(__file__).resolve().parents[1] / '.env'
    
    for env_path in [backend_env, root_env]:
        if env_path.exists():
            load_dotenv(env_path, override=True)
            loaded_any = True
            loaded_from.append(str(env_path))
    
    if not loaded_any:
        found = find_dotenv(usecwd=True)
        if found:
            load_dotenv(found, override=True)
            loaded_from.append(str(found))
    
    # Re-check after loading .env files
    if not SUPABASE_URL:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
    if not SUPABASE_KEY:
        SUPABASE_KEY = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_SERVICE_KEY")
            or os.getenv("SUPABASE_KEY")
        )

if not SUPABASE_URL or not SUPABASE_KEY:
    debug_lines = [
        "Supabase credentials are missing.",
        f"Tried loading .env from: {', '.join(loaded_from) or 'none'}",
        f"Has SUPABASE_URL: {bool(SUPABASE_URL)}",
        f"Has SERVICE ROLE KEY: {bool(SUPABASE_KEY)}",
        "",
        "For PRODUCTION (Docker/Railway):",
        "  Set environment variables in your deployment platform:",
        "  - SUPABASE_URL=https://<your-ref>.supabase.co",
        "  - SUPABASE_SERVICE_ROLE_KEY=<service_role key>",
        "",
        "For LOCAL DEVELOPMENT:",
        "  Create backend/.env file with:",
        "  SUPABASE_URL=https://<your-ref>.supabase.co",
        "  SUPABASE_SERVICE_ROLE_KEY=<service_role key>",
    ]
    raise ValueError("\n".join(debug_lines))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) 