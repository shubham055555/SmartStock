import uuid
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.product import Product
from app.models.transaction import StockTransaction
from app.models.audit_log import AuditLog
from app.utils.errors import InsufficientStockError, ValidationError

class StockService:
    @staticmethod
    def process_stock_in(product_id, quantity, user_id, unit_price=None, reference_no=None, notes=None):
        """
        Executes an atomic Stock IN operation.
        Increases product inventory, records transaction, and prevents race conditions.
        """
        if quantity <= 0:
            raise ValidationError("Quantity for Stock IN must be greater than zero.")

        # Atomic transaction execution
        try:
            # Query product with row lock if supported by the DB dialect
            query = Product.query.filter_by(id=product_id)
            if db.engine.name == "postgresql":
                query = query.with_for_update()
            
            product = query.first()
            if not product:
                raise ValidationError(f"Product with ID {product_id} does not exist.")

            effective_unit_price = Decimal(str(unit_price)) if unit_price is not None else Decimal(str(product.cost_price))
            total_amount = round(effective_unit_price * quantity, 2)
            ref_no = reference_no or f"IN-{uuid.uuid4().hex[:8].upper()}"

            # Atomic update
            product.quantity += quantity
            balance_after = product.quantity

            # If user provided a unit price, update cost price
            if unit_price is not None and Decimal(str(unit_price)) > 0:
                product.cost_price = effective_unit_price

            transaction = StockTransaction(
                product_id=product.id,
                user_id=user_id,
                transaction_type="IN",
                quantity=quantity,
                unit_price=effective_unit_price,
                total_amount=total_amount,
                balance_after=balance_after,
                reference_no=ref_no,
                notes=notes
            )
            db.session.add(transaction)

            # Audit trail
            audit = AuditLog(
                user_id=user_id,
                action="STOCK_IN",
                resource_type="Product",
                resource_id=str(product.id),
                details=f"Stock IN: added {quantity} units to {product.name} (SKU: {product.sku}). New balance: {balance_after}. Ref: {ref_no}"
            )
            db.session.add(audit)

            db.session.commit()
            return transaction, product

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def process_stock_out(product_id, quantity, user_id, unit_price=None, reference_no=None, notes=None):
        """
        Executes an atomic Stock OUT operation.
        Validates inventory sufficiency, prevents negative stock, and writes transaction audit log.
        """
        if quantity <= 0:
            raise ValidationError("Quantity for Stock OUT must be greater than zero.")

        try:
            query = Product.query.filter_by(id=product_id)
            if db.engine.name == "postgresql":
                query = query.with_for_update()

            product = query.first()
            if not product:
                raise ValidationError(f"Product with ID {product_id} does not exist.")

            # Strict Negative Inventory Prevention
            if product.quantity < quantity:
                raise InsufficientStockError(
                    f"Cannot dispense {quantity} units. Only {product.quantity} units are currently available for product '{product.name}' (SKU: {product.sku}).",
                    available=product.quantity,
                    requested=quantity
                )

            effective_unit_price = Decimal(str(unit_price)) if unit_price is not None else Decimal(str(product.unit_price))
            total_amount = round(effective_unit_price * quantity, 2)
            ref_no = reference_no or f"OUT-{uuid.uuid4().hex[:8].upper()}"

            # Deduct stock atomically
            product.quantity -= quantity
            balance_after = product.quantity

            transaction = StockTransaction(
                product_id=product.id,
                user_id=user_id,
                transaction_type="OUT",
                quantity=quantity,
                unit_price=effective_unit_price,
                total_amount=total_amount,
                balance_after=balance_after,
                reference_no=ref_no,
                notes=notes
            )
            db.session.add(transaction)

            audit = AuditLog(
                user_id=user_id,
                action="STOCK_OUT",
                resource_type="Product",
                resource_id=str(product.id),
                details=f"Stock OUT: dispensed {quantity} units from {product.name} (SKU: {product.sku}). Remaining balance: {balance_after}. Ref: {ref_no}"
            )
            db.session.add(audit)

            db.session.commit()
            return transaction, product

        except Exception as e:
            db.session.rollback()
            raise e
