from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.category import Category
from app.utils.decorators import admin_required
from app.utils.errors import ValidationError

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

@categories_bp.route("", methods=["GET"])
@jwt_required()
def list_categories():
    include_counts = request.args.get("with_counts", "true").lower() == "true"
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify({
        "success": True,
        "count": len(categories),
        "data": [c.to_dict(include_counts=include_counts) for c in categories]
    }), 200

@categories_bp.route("", methods=["POST"])
@jwt_required()
def create_category():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        raise ValidationError("Category name is required.")

    if Category.query.filter_by(name=name).first():
        return jsonify({"success": False, "error": "Conflict", "message": f"Category '{name}' already exists."}), 409

    category = Category(name=name, description=description)
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Category created successfully.",
        "data": category.to_dict()
    }), 201

@categories_bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    category = db.get_or_404(Category, category_id)
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    
    if name and name != category.name:
        existing = Category.query.filter_by(name=name).first()
        if existing:
            return jsonify({"success": False, "error": "Conflict", "message": f"Category '{name}' already exists."}), 409
        category.name = name

    if "description" in data:
        category.description = data["description"].strip()

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Category updated successfully.",
        "data": category.to_dict()
    }), 200

@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_category(category_id):
    category = db.get_or_404(Category, category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Category '{category.name}' deleted successfully."
    }), 200
