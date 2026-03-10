import os
import logging


def get_secret(key, default):
    if os.path.isfile(f"/run/secrets/{key}"):
        with open(f"/run/secrets/{key}") as f:
            res = f.read().strip()
            return res
    logging.warning(f"/run/secrets/{key} not found")
    value = os.getenv(key, default)
    return value


REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
ALGORITHM = os.getenv("ALGORITHM", "RS256")
PUBLIC_KEY = get_secret('jwt_public_key', "")
