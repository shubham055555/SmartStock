from datetime import datetime
from app.extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    products = db.relationship("Product", backref="category", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_counts=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_counts:
            data["product_count"] = self.products.count()
        return data
