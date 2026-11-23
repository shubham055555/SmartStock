from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.supplier import Supplier
from app.utils.decorators import admin_required
from app.utils.errors import ValidationError

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")

@suppliers_bp.route("", methods=["GET"])
@jwt_required()
def list_suppliers():
    include_counts = request.args.get("with_counts", "true").lower() == "true"
    suppliers = Supplier.query.order_by(Supplier.name.asc()).all()
    return jsonify({
        "success": True,
        "count": len(suppliers),
        "data": [s.to_dict(include_counts=include_counts) for s in suppliers]
    }), 200

@suppliers_bp.route("", methods=["POST"])
@jwt_required()
def create_supplier():
    data = request.get_json() or {}
    name = data.get("name", "").strip()

    if not name:
        raise ValidationError("Supplier name is required.")

    supplier = Supplier(
        name=name,
        contact_name=data.get("contact_name", "").strip(),
        email=data.get("email", "").strip(),
        phone=data.get("phone", "").strip(),
        address=data.get("address", "").strip()
    )
    db.session.add(supplier)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Supplier created successfully.",
        "data": supplier.to_dict()
    }), 201

@suppliers_bp.route("/<int:supplier_id>", methods=["PUT"])
@jwt_required()
def update_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    data = request.get_json() or {}

    if "name" in data and data["name"].strip():
        supplier.name = data["name"].strip()
    if "contact_name" in data:
        supplier.contact_name = data["contact_name"].strip()
    if "email" in data:
        supplier.email = data["email"].strip()
    if "phone" in data:
        supplier.phone = data["phone"].strip()
    if "address" in data:
        supplier.address = data["address"].strip()

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Supplier updated successfully.",
        "data": supplier.to_dict()
    }), 200

@suppliers_bp.route("/<int:supplier_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Supplier '{supplier.name}' deleted successfully."
    }), 200
