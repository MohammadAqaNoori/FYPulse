import sys
import os
from loguru import logger

# Remove default handler
logger.remove()

# Console handler — colored, readable
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
)

# File handler — keeps a rolling log
os.makedirs("logs", exist_ok=True)
logger.add(
    "logs/ml_service.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
)
