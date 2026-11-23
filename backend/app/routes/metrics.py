from flask import Blueprint, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Gauge, Histogram
from sqlalchemy import func
from app.extensions import db
from app.models.product import Product
from app.models.transaction import StockTransaction

metrics_bp = Blueprint("metrics", __name__)

# Prometheus Metrics Definitions
HTTP_REQUESTS_TOTAL = Counter(
    "smartstock_http_requests_total",
    "Total number of HTTP requests processed",
    ["method", "endpoint", "status"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "smartstock_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)

INVENTORY_ITEMS_TOTAL = Gauge(
    "smartstock_inventory_items_total",
    "Total distinct product SKUs in inventory"
)

INVENTORY_UNITS_TOTAL = Gauge(
    "smartstock_inventory_units_total",
    "Total physical inventory quantity units"
)

INVENTORY_VALUE_TOTAL = Gauge(
    "smartstock_inventory_value_usd",
    "Total estimated inventory valuation"
)

STOCK_OPERATIONS_TOTAL = Counter(
    "smartstock_operations_total",
    "Total inventory transactions by type",
    ["type"]
)

@metrics_bp.route("/metrics", methods=["GET"])
def metrics():
    """
    Exposes metrics for Prometheus scraper.
    Gathers real-time database state before serving latest metrics.
    """
    try:
        total_items = Product.query.count()
        INVENTORY_ITEMS_TOTAL.set(total_items)

        stock_agg = db.session.query(
            func.coalesce(func.sum(Product.quantity), 0),
            func.coalesce(func.sum(Product.quantity * Product.cost_price), 0.0)
        ).first()

        if stock_agg:
            INVENTORY_UNITS_TOTAL.set(int(stock_agg[0]))
            INVENTORY_VALUE_TOTAL.set(float(stock_agg[1]))
    except Exception:
        pass  # In test contexts or pre-init, metrics exporter should not fail

    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
