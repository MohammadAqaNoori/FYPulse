import sys
from loguru import logger

# Remove default handler
logger.remove()

# Console handler — colored, readable
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    encoding="utf-8",
)

# File handler — keeps a rolling log
logger.add(
    "logs/ml_service.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
    encoding="utf-8",
)
