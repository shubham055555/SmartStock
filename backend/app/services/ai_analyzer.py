import re
import os

class AILogAnalyzerService:
    """
    Intelligent Log Analysis Module for DevOps & Inventory Platform.
    Sanitizes sensitive data and classifies error logs, identifies root cause,
    and produces actionable remediation steps.
    Supports a robust deterministic pattern-matching engine + optional external provider.
    """

    PATTERNS = [
        {
            "category": "DATABASE_CONNECTIVITY",
            "regex": r"(psycopg2|OperationalError|connection to server at|could not connect to server|Connection refused|password authentication failed)",
            "title": "PostgreSQL Connection Failure",
            "severity": "CRITICAL",
            "root_cause": "The backend service is unable to establish or maintain a socket connection to PostgreSQL. Potential causes include database container downtime, misconfigured DATABASE_URL, network partition, or exhausted connection pool.",
            "remediation": [
                "Verify PostgreSQL status using: docker compose ps postgres OR kubectl get pods -l app=postgres",
                "Inspect database container logs: docker compose logs -f postgres",
                "Verify database credentials in .env match DB_USER and DB_PASSWORD",
                "Check connection pooling limits in SQLAlchemy configuration",
                "Confirm network bridge connectivity between backend and db containers"
            ]
        },
        {
            "category": "INSUFFICIENT_STOCK",
            "regex": r"(InsufficientStockError|Cannot dispense|negative inventory|CheckConstraint.*check_positive_stock)",
            "title": "Stock Depletion & Negative Inventory Block",
            "severity": "HIGH",
            "root_cause": "A Stock OUT transaction was attempted for a quantity exceeding available physical or system inventory. The database transactional check constraint prevented inconsistent ledger states.",
            "remediation": [
                "Review pending purchase orders and issue a Stock IN for the depleted SKU",
                "Check recent stock transaction audit logs for accidental double-dispense events",
                "Configure automated low-stock reorder thresholds in product settings",
                "Notify warehouse staff to conduct a physical cycle count"
            ]
        },
        {
            "category": "AUTH_TOKEN_EXPIRED",
            "regex": r"(ExpiredSignatureError|Signature has expired|Token has expired|InvalidHeaderError|NoAuthorizationError)",
            "title": "JWT Authentication Token Expiration",
            "severity": "MEDIUM",
            "root_cause": "The client request carried an expired or missing JSON Web Token (JWT). The user session has elapsed or the client failed to call the refresh endpoint.",
            "remediation": [
                "Ensure client Axios interceptor captures 401 and invokes /api/auth/refresh",
                "Verify JWT_ACCESS_TOKEN_EXPIRES_MINUTES matches operational expectations",
                "Have the user re-login using valid credentials"
            ]
        },
        {
            "category": "UNIQUE_CONSTRAINT_VIOLATION",
            "regex": r"(IntegrityError|UNIQUE constraint failed|duplicate key value violates unique constraint|Key \(sku\)=|Key \(email\)=)",
            "title": "Database Unique Constraint Collision",
            "severity": "MEDIUM",
            "root_cause": "Attempted to persist an entity (Product SKU, barcode, username, or email) that violates a relational UNIQUE constraint in the database.",
            "remediation": [
                "Validate input client-side before submission to ensure SKU / barcode uniqueness",
                "Review SKU auto-generation sequence or barcode scanner input",
                "If editing an existing record, ensure the update query excludes the current record ID"
            ]
        },
        {
            "category": "KUBERNETES_OOM_RESOURCE",
            "regex": r"(OOMKilled|Exit Code 137|cgroup out of memory|MemoryError)",
            "title": "Container Out-Of-Memory (OOM) Termination",
            "severity": "CRITICAL",
            "root_cause": "Container memory consumption exceeded the defined Kubernetes or Docker resource limit. The Linux kernel OOM-killer killed the process.",
            "remediation": [
                "Inspect memory profile using kubectl top pods or Prometheus container_memory_working_set_bytes",
                "Increase Kubernetes memory limits in kubernetes/backend-deployment.yaml (e.g. from 256Mi to 512Mi)",
                "Review application pagination limits to ensure large datasets are chunked",
                "Inspect Gunicorn worker count: adjust --workers based on available core memory"
            ]
        },
        {
            "category": "HTTP_CORS_FAILURE",
            "regex": r"(CORS policy|No 'Access-Control-Allow-Origin'|Cross-Origin Request Blocked)",
            "title": "Cross-Origin Resource Sharing (CORS) Rejection",
            "severity": "MEDIUM",
            "root_cause": "The frontend origin was not found in the allowed CORS_ORIGINS whitelist, or the preflight OPTIONS request was rejected.",
            "remediation": [
                "Update CORS_ORIGINS in .env to include the requesting host and port",
                "Verify Flask-CORS initialization in app factory with supports_credentials=True",
                "Check Nginx reverse-proxy configuration if proxying in production"
            ]
        }
    ]

    @classmethod
    def sanitize_log(cls, raw_text: str) -> str:
        """
        Masks passwords, bearer tokens, API keys and sensitive URLs from logs.
        """
        text = raw_text
        text = re.sub(r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', r'\1[REDACTED_JWT]', text, flags=re.IGNORECASE)
        text = re.sub(r'([pP]assword[:=]\s*)[^\s,;&]+', r'\1[REDACTED_PASSWORD]', text)
        text = re.sub(r'(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)', r'\1[REDACTED_CREDENTIALS]\2', text)
        text = re.sub(r'(api[_-]?key[:=]\s*)[A-Za-z0-9_\-]+', r'\1[REDACTED_API_KEY]', text, flags=re.IGNORECASE)
        return text

    @classmethod
    def analyze_log(cls, log_text: str) -> dict:
        """
        Analyzes an input error log trace and returns root cause and remediation.
        """
        sanitized = cls.sanitize_log(log_text)
        
        # Match against deterministic intelligence rules
        for pattern in cls.PATTERNS:
            if re.search(pattern["regex"], sanitized, re.IGNORECASE):
                return {
                    "matched": True,
                    "engine": "Deterministic AI Heuristics Engine",
                    "category": pattern["category"],
                    "title": pattern["title"],
                    "severity": pattern["severity"],
                    "root_cause": pattern["root_cause"],
                    "remediation": pattern["remediation"],
                    "sanitized_snippet": sanitized[:500],
                }

        # Fallback for unrecognized error traces
        return {
            "matched": False,
            "engine": "Heuristic Exception Analyzer",
            "category": "UNKNOWN_APPLICATION_ERROR",
            "title": "Unclassified System Exception",
            "severity": "MEDIUM",
            "root_cause": "The log message contains an unclassified application or runtime exception. The stack trace indicates an unexpected condition during execution.",
            "remediation": [
                "Check application debug log output with request ID correlation",
                "Verify input parameters passed to the failing API route",
                "Check backend unit test coverage for the associated service function",
                "Inspect Prometheus error rate metric (http_requests_total{status=~'5..'}) for impact"
            ],
            "sanitized_snippet": sanitized[:500],
        }
