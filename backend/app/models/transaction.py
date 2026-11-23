from datetime import datetime
from app.extensions import db

class StockTransaction(db.Model):
    __tablename__ = "stock_transactions"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_type = db.Column(db.String(10), nullable=False, index=True)  # 'IN' or 'OUT'
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    reference_no = db.Column(db.String(64), nullable=True, index=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        db.CheckConstraint("quantity > 0", name="check_positive_tx_quantity"),
        db.CheckConstraint("transaction_type IN ('IN', 'OUT')", name="check_valid_tx_type"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "Deleted Product",
            "product_sku": self.product.sku if self.product else "-",
            "user_id": self.user_id,
            "user_name": self.user.username if self.user else "System",
            "transaction_type": self.transaction_type,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "total_amount": float(self.total_amount),
            "balance_after": self.balance_after,
            "reference_no": self.reference_no,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
