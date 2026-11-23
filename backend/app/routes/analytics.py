from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.transaction import StockTransaction

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    total_products = Product.query.count()
    
    # Calculate stock aggregate
    stock_agg = db.session.query(
        func.coalesce(func.sum(Product.quantity), 0),
        func.coalesce(func.sum(Product.quantity * Product.cost_price), 0.0)
    ).first()

    total_stock_units = int(stock_agg[0]) if stock_agg else 0
    total_inventory_value = round(float(stock_agg[1]), 2) if stock_agg else 0.0

    low_stock_count = Product.query.filter(
        Product.quantity <= Product.reorder_level,
        Product.quantity > 0
    ).count()

    out_of_stock_count = Product.query.filter(Product.quantity == 0).count()
    total_transactions = StockTransaction.query.count()
    total_categories = Category.query.count()
    total_suppliers = Supplier.query.count()

    return jsonify({
        "success": True,
        "summary": {
            "total_products": total_products,
            "total_stock_units": total_stock_units,
            "total_inventory_value": total_inventory_value,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "total_transactions": total_transactions,
            "total_categories": total_categories,
            "total_suppliers": total_suppliers,
        }
    }), 200

@analytics_bp.route("/charts", methods=["GET"])
@jwt_required()
def get_charts():
    # Category Distribution
    categories = Category.query.all()
    category_distribution = []
    for c in categories:
        agg = db.session.query(
            func.coalesce(func.sum(Product.quantity), 0),
            func.coalesce(func.sum(Product.quantity * Product.cost_price), 0.0)
        ).filter(Product.category_id == c.id).first()
        
        category_distribution.append({
            "name": c.name,
            "product_count": c.products.count(),
            "stock_units": int(agg[0]) if agg else 0,
            "total_value": round(float(agg[1]), 2) if agg else 0.0
        })

    # Top 5 value products
    top_products = Product.query.order_by((Product.quantity * Product.cost_price).desc()).limit(5).all()
    top_value_products = [
        {
            "name": p.name,
            "sku": p.sku,
            "quantity": p.quantity,
            "total_value": round(float(p.cost_price) * p.quantity, 2)
        } for p in top_products
    ]

    # Stock Movement by Type
    stock_in_total = db.session.query(func.coalesce(func.sum(StockTransaction.quantity), 0)).filter_by(transaction_type="IN").scalar()
    stock_out_total = db.session.query(func.coalesce(func.sum(StockTransaction.quantity), 0)).filter_by(transaction_type="OUT").scalar()

    # Recent Transactions Trend (grouped by last 7 records or simulated daily movement)
    recent_txs = StockTransaction.query.order_by(StockTransaction.created_at.asc()).limit(30).all()
    tx_timeline = [
        {
            "date": t.created_at.strftime("%b %d %H:%M"),
            "type": t.transaction_type,
            "quantity": t.quantity,
            "balance_after": t.balance_after,
            "product": t.product.name if t.product else "Item"
        } for t in recent_txs
    ]

    return jsonify({
        "success": True,
        "category_distribution": category_distribution,
        "top_value_products": top_value_products,
        "stock_movement": {
            "total_in": int(stock_in_total or 0),
            "total_out": int(stock_out_total or 0),
            "timeline": tx_timeline
        }
    }), 200
