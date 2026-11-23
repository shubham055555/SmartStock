from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.transaction import StockTransaction
from app.models.audit_log import AuditLog
from app.services.stock_service import StockService
from app.utils.errors import ValidationError

stock_bp = Blueprint("stock", __name__, url_prefix="/api/stock")

@stock_bp.route("/in", methods=["POST"])
@jwt_required()
def stock_in():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity")
    unit_price = data.get("unit_price")
    reference_no = data.get("reference_no")
    notes = data.get("notes")

    if not product_id or quantity is None:
        raise ValidationError("Both 'product_id' and 'quantity' are required.")

    tx, product = StockService.process_stock_in(
        product_id=product_id,
        quantity=int(quantity),
        user_id=user_id,
        unit_price=unit_price,
        reference_no=reference_no,
        notes=notes
    )

    return jsonify({
        "success": True,
        "message": f"Stock IN successful. Added {quantity} units to {product.name}.",
        "transaction": tx.to_dict(),
        "product": product.to_dict()
    }), 200

@stock_bp.route("/out", methods=["POST"])
@jwt_required()
def stock_out():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity")
    unit_price = data.get("unit_price")
    reference_no = data.get("reference_no")
    notes = data.get("notes")

    if not product_id or quantity is None:
        raise ValidationError("Both 'product_id' and 'quantity' are required.")

    tx, product = StockService.process_stock_out(
        product_id=product_id,
        quantity=int(quantity),
        user_id=user_id,
        unit_price=unit_price,
        reference_no=reference_no,
        notes=notes
    )

    return jsonify({
        "success": True,
        "message": f"Stock OUT successful. Dispensed {quantity} units from {product.name}.",
        "transaction": tx.to_dict(),
        "product": product.to_dict()
    }), 200

@stock_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 15, type=int), 100)
    product_id = request.args.get("product_id", type=int)
    tx_type = request.args.get("type", "").upper()

    query = StockTransaction.query

    if product_id:
        query = query.filter_by(product_id=product_id)
    if tx_type in ["IN", "OUT"]:
        query = query.filter_by(transaction_type=tx_type)

    pagination = query.order_by(StockTransaction.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "success": True,
        "data": [t.to_dict() for t in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        }
    }), 200

@stock_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
def get_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    pagination = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "success": True,
        "data": [a.to_dict() for a in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
        }
    }), 200
