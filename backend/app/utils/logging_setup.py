import json
import logging
import uuid
from flask import g, request

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        try:
            record.request_id = getattr(g, "request_id", "system")
        except RuntimeError:
            record.request_id = "system"
        return True

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "system"),
            "path": getattr(record, "path", None),
            "method": getattr(record, "method", None),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_structured_logging(app):
    handler = logging.StreamHandler()
    formatter = JsonFormatter()
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())
    
    # Replace default handlers with structured json handler
    app.logger.handlers = [handler]
    app.logger.setLevel(logging.INFO if not app.debug else logging.DEBUG)
