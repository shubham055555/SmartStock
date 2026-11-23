from datetime import datetime
from app.extensions import db

class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    contact_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(40), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    products = db.relationship("Product", backref="supplier", lazy="dynamic")

    def to_dict(self, include_counts=False):
        data = {
            "id": self.id,
            "name": self.name,
            "contact_name": self.contact_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_counts:
            data["product_count"] = self.products.count()
        return data
