import os
from flask import Blueprint, jsonify
from app.extensions import db

health_bp = Blueprint("health", __name__)

@health_bp.route("/healthz", methods=["GET"])
def healthz():
    """
    Kubernetes / Docker Liveness probe endpoint.
    Returns 200 if the web process is running.
    """
    return jsonify({
        "status": "healthy",
        "service": "smartstock-backend",
        "environment": os.getenv("FLASK_ENV", "production")
    }), 200

@health_bp.route("/ready", methods=["GET"])
def ready():
    """
    Kubernetes / Docker Readiness probe endpoint.
    Verifies database connection and query readiness.
    """
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({
            "status": "ready",
            "database": "connected",
            "service": "smartstock-backend"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 503

@health_bp.route("/api/info", methods=["GET"])
def api_info():
    """
    Application metadata and versioning information.
    """
    return jsonify({
        "name": "SmartStock — Smart Inventory Management & DevOps Automation Platform",
        "version": "1.0.0",
        "course": "B.Tech CSE Semester VII DevOps & Automation Lab (ENSP461)",
        "features": [
            "JWT Authentication & RBAC",
            "Atomic Inventory Concurrency & Negative Stock Lock",
            "Prometheus Observability",
            "AI Root Cause Log Analyzer",
            "PostgreSQL Relational Schema",
            "Structured JSON Logging"
        ]
    }), 200
