import logging
import os
from dotenv import load_dotenv


def get_secret(key, default):
    if os.path.isfile(f"/run/secrets/{key}"):
        with open(f"/run/secrets/{key}") as f:
            res = f.read()
            return res
    logging.warning(f"/run/assert/{key} not found")
    value = os.getenv(key, default)
    return value


load_dotenv()

log_level = os.getenv("LOG_LEVEL", "INFO")
log_file = os.getenv("LOG_FILE", None)
log_format = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")


ALGORITHM = os.getenv("ALGORITHM", "RS256")
PUBLIC_KEY = get_secret('jwt_public_key', "")