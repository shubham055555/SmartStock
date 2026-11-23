import os
import time
import uuid
from flask import Flask, request, g, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, migrate, cors
from app.utils.logging_setup import setup_structured_logging
from app.utils.errors import register_error_handlers
from app.routes.metrics import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    config_class = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Logging setup
    setup_structured_logging(app)
    register_error_handlers(app)

    # Middleware: Request ID and Prometheus Latency Tracking
    @app.before_request
    def before_request():
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        g.start_time = time.time()

    @app.after_request
    def after_request(response):
        response.headers["X-Request-ID"] = getattr(g, "request_id", "unknown")
        
        # Track metrics
        if hasattr(g, "start_time"):
            duration = time.time() - g.start_time
            endpoint = request.endpoint or "unknown"
            method = request.method
            status = str(response.status_code)
            try:
                HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status=status).inc()
                HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=endpoint).observe(duration)
            except Exception:
                pass

        # Structured request logging
        if not request.path.startswith("/health") and not request.path == "/metrics":
            app.logger.info(
                f"{request.method} {request.path} {response.status_code}",
                extra={"method": request.method, "path": request.path}
            )

        return response

    # JWT Error Callbacks for clear JSON responses
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({
            "success": False,
            "error": "Unauthorized",
            "message": "Authorization header missing or invalid. Please login."
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({
            "success": False,
            "error": "Token Expired",
            "message": "The access token has expired. Please refresh your session or login again."
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({
            "success": False,
            "error": "Invalid Token",
            "message": "Token verification failed. Please login again."
        }), 401

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.categories import categories_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.stock import stock_bp
    from app.routes.analytics import analytics_bp
    from app.routes.health import health_bp
    from app.routes.metrics import metrics_bp
    from app.routes.ai_logs import ai_logs_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_logs_bp)

    # OpenAPI / Swagger Specification Endpoint
    @app.route("/api/openapi.json", methods=["GET"])
    def openapi_spec():
        return jsonify({
            "openapi": "3.0.3",
            "info": {
                "title": "SmartStock Inventory & DevOps API",
                "version": "1.0.0",
                "description": "Production-grade RESTful API for SmartStock Inventory and DevOps Automation Platform."
            },
            "servers": [{"url": "/"}],
            "paths": {
                "/healthz": {"get": {"summary": "Liveness probe"}},
                "/ready": {"get": {"summary": "Readiness probe"}},
                "/metrics": {"get": {"summary": "Prometheus metrics"}},
                "/api/auth/login": {"post": {"summary": "User authentication"}},
                "/api/auth/register": {"post": {"summary": "User registration"}},
                "/api/products": {"get": {"summary": "List products"}, "post": {"summary": "Create product"}},
                "/api/stock/in": {"post": {"summary": "Process Stock IN"}},
                "/api/stock/out": {"post": {"summary": "Process Stock OUT"}},
                "/api/analytics/summary": {"get": {"summary": "Inventory KPIs"}},
                "/api/ai/diagnose-log": {"post": {"summary": "AI Log diagnosis"}}
            }
        }), 200

    return app
