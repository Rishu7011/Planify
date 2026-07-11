import logging
import json
import uuid
from pythonjsonlogger import jsonlogger


class CorrelationIdFilter(logging.Filter):
    """Attach a unique correlation_id to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = str(uuid.uuid4())
        return True


def setup_logging() -> logging.Logger:
    """Configure structured JSON logging for the application."""
    log_handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    log_handler.setFormatter(formatter)

    logger = logging.getLogger()
    logger.handlers.clear()
    logger.addHandler(log_handler)
    logger.setLevel(logging.INFO)
    logger.addFilter(CorrelationIdFilter())

    return logger
