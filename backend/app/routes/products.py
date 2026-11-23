import csv
import io
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from sqlalchemy import or_
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.utils.decorators import admin_required
from app.utils.errors import ValidationError

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

@products_bp.route("", methods=["GET"])
@jwt_required()
def list_products():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)
    search = request.args.get("q", "").strip()
    category_id = request.args.get("category_id", type=int)
    supplier_id = request.args.get("supplier_id", type=int)
    stock_status = request.args.get("stock_status", "").strip().upper()
    sort_by = request.args.get("sort_by", "name")
    order = request.args.get("order", "asc")

    query = Product.query

    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.barcode.ilike(f"%{search}%")
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)

    if stock_status == "LOW_STOCK":
        query = query.filter(Product.quantity <= Product.reorder_level, Product.quantity > 0)
    elif stock_status == "OUT_OF_STOCK":
        query = query.filter(Product.quantity == 0)
    elif stock_status == "IN_STOCK":
        query = query.filter(Product.quantity > Product.reorder_level)

    # Sorting
    sort_column = getattr(Product, sort_by, Product.name)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "success": True,
        "data": [p.to_dict() for p in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        }
    }), 200

@products_bp.route("/low-stock", methods=["GET"])
@jwt_required()
def get_low_stock():
    products = Product.query.filter(Product.quantity <= Product.reorder_level).order_by(Product.quantity.asc()).all()
    return jsonify({
        "success": True,
        "count": len(products),
        "data": [p.to_dict() for p in products]
    }), 200

@products_bp.route("/export/csv", methods=["GET"])
@jwt_required()
def export_csv():
    products = Product.query.order_by(Product.name.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "SKU", "Barcode", "Name", "Category", "Supplier",
        "Cost Price", "Unit Price", "Quantity", "Reorder Level", "Stock Status", "Total Value"
    ])

    for p in products:
        writer.writerow([
            p.id, p.sku, p.barcode or p.sku, p.name,
            p.category.name if p.category else "Uncategorized",
            p.supplier.name if p.supplier else "None",
            float(p.cost_price), float(p.unit_price),
            p.quantity, p.reorder_level, p.stock_status,
            round(float(p.cost_price) * p.quantity, 2)
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=smartstock_inventory_report.csv"}
    )

@products_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    data = request.get_json() or {}
    sku = data.get("sku", "").strip().upper()
    name = data.get("name", "").strip()
    category_id = data.get("category_id")
    supplier_id = data.get("supplier_id")
    cost_price = data.get("cost_price", 0.0)
    unit_price = data.get("unit_price", 0.0)
    quantity = data.get("quantity", 0)
    reorder_level = data.get("reorder_level", 10)
    barcode = data.get("barcode", sku).strip()
    description = data.get("description", "").strip()

    if not sku:
        raise ValidationError("SKU code is required.")
    if not name:
        raise ValidationError("Product name is required.")
    if not category_id:
        raise ValidationError("Valid category_id is required.")

    if Product.query.filter_by(sku=sku).first():
        return jsonify({"success": False, "error": "Conflict", "message": f"Product with SKU '{sku}' already exists."}), 409

    if barcode and Product.query.filter_by(barcode=barcode).first():
        return jsonify({"success": False, "error": "Conflict", "message": f"Product with Barcode '{barcode}' already exists."}), 409

    product = Product(
        sku=sku,
        barcode=barcode or sku,
        name=name,
        description=description,
        category_id=category_id,
        supplier_id=supplier_id,
        cost_price=cost_price,
        unit_price=unit_price,
        quantity=quantity,
        reorder_level=reorder_level
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Product created successfully.",
        "data": product.to_dict()
    }), 201

@products_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({"success": True, "data": product.to_dict()}), 200

@products_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json() or {}

    if "name" in data and data["name"].strip():
        product.name = data["name"].strip()
    if "description" in data:
        product.description = data["description"].strip()
    if "category_id" in data:
        product.category_id = data["category_id"]
    if "supplier_id" in data:
        product.supplier_id = data["supplier_id"]
    if "cost_price" in data:
        product.cost_price = data["cost_price"]
    if "unit_price" in data:
        product.unit_price = data["unit_price"]
    if "reorder_level" in data:
        product.reorder_level = data["reorder_level"]
    if "barcode" in data and data["barcode"].strip():
        product.barcode = data["barcode"].strip()

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Product updated successfully.",
        "data": product.to_dict()
    }), 200

@products_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Product '{product.name}' deleted successfully."
    }), 200
