import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Automatically load .env file if present
def load_env_file():
    for env_path in [BASE_DIR / ".env", BASE_DIR.parent / ".env"]:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v

load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL or DATABASE_URL.startswith("sqlite:///./") or DATABASE_URL == "sqlite:///data/concept_mapper.db":
    rel_name = "concept_mapper.db"
    if "data/" in DATABASE_URL:
        rel_name = DATABASE_URL.split("data/")[-1]
    abs_db_path = DATA_DIR / rel_name
    DATABASE_URL = f"sqlite:///{abs_db_path.as_posix()}"
elif DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:////") and ":" not in DATABASE_URL[10:13]:
    # Relative path in sqlite
    clean_path = DATABASE_URL.replace("sqlite:///", "")
    abs_db_path = (BASE_DIR / clean_path).resolve()
    DATABASE_URL = f"sqlite:///{abs_db_path.as_posix()}"

PROJECT_TITLE = "Improving Student Learning Outcomes Using Smart AI-Based Concept Dependency Mapper Compared to Traditional Learning Systems"
API_PREFIX = "/api"


