from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.ai_analyzer import AILogAnalyzerService
from app.utils.errors import ValidationError

ai_logs_bp = Blueprint("ai_logs", __name__, url_prefix="/api/ai")

SAMPLE_ERROR_LOGS = [
    {
        "id": "sample-1",
        "title": "PostgreSQL Connection Refusal",
        "log": "psycopg2.OperationalError: could not connect to server: Connection refused\nIs the server running on host \"postgres\" (172.18.0.2) and accepting TCP/IP connections on port 5432?"
    },
    {
        "id": "sample-2",
        "title": "Negative Inventory Stock Rejection",
        "log": "app.utils.errors.InsufficientStockError: Cannot dispense 25 units. Only 8 units are currently available for product 'Industrial Stepper Motor' (SKU: MOT-IND-404)."
    },
    {
        "id": "sample-3",
        "title": "JWT Signature Expiration",
        "log": "flask_jwt_extended.exceptions.JWTExtendedException: Signature has expired. The access token provided is no longer valid."
    },
    {
        "id": "sample-4",
        "title": "Duplicate SKU Unique Constraint",
        "log": "sqlalchemy.exc.IntegrityError: (psycopg2.errors.UniqueViolation) duplicate key value violates unique constraint \"uq_products_sku\"\nDETAIL: Key (sku)=(WIDGET-PRO-100) already exists."
    },
    {
        "id": "sample-5",
        "title": "Kubernetes OOM Killed Event",
        "log": "Warning  OOMKilled  pod/smartstock-backend-6c9bbf9-x7q9d  Container backend exceeded memory limit (256Mi). Exit Code 137."
    }
]

@ai_logs_bp.route("/samples", methods=["GET"])
@jwt_required()
def get_sample_logs():
    return jsonify({
        "success": True,
        "samples": SAMPLE_ERROR_LOGS
    }), 200

@ai_logs_bp.route("/diagnose-log", methods=["POST"])
@jwt_required()
def diagnose_log():
    data = request.get_json() or {}
    log_text = data.get("log", "").strip()

    if not log_text:
        raise ValidationError("Field 'log' is required for AI log analysis.")

    diagnosis = AILogAnalyzerService.analyze_log(log_text)
    return jsonify({
        "success": True,
        "diagnosis": diagnosis
    }), 200
