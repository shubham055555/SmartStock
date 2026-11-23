from datetime import datetime
from app.extensions import db

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(64), unique=True, nullable=False, index=True)
    barcode = db.Column(db.String(64), unique=True, nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    cost_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, default=10)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.CheckConstraint("quantity >= 0", name="check_positive_stock"),
        db.CheckConstraint("cost_price >= 0", name="check_positive_cost"),
        db.CheckConstraint("unit_price >= 0", name="check_positive_price"),
    )

    transactions = db.relationship("StockTransaction", backref="product", lazy="dynamic", cascade="all, delete-orphan")

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def stock_status(self):
        if self.quantity == 0:
            return "OUT_OF_STOCK"
        elif self.quantity <= self.reorder_level:
            return "LOW_STOCK"
        return "IN_STOCK"

    def to_dict(self):
        return {
            "id": self.id,
            "sku": self.sku,
            "barcode": self.barcode or self.sku,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "Uncategorized",
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else "None",
            "cost_price": float(self.cost_price),
            "unit_price": float(self.unit_price),
            "quantity": self.quantity,
            "reorder_level": self.reorder_level,
            "is_active": self.is_active,
            "is_low_stock": self.is_low_stock,
            "stock_status": self.stock_status,
            "total_value": round(float(self.cost_price) * self.quantity, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
