import os
from decimal import Decimal
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.transaction import StockTransaction
from app.models.audit_log import AuditLog

app = create_app(os.getenv("FLASK_ENV", "development"))

def seed_database():
    with app.app_context():
        print("🌱 Initializing SmartStock database schema...")
        db.create_all()

        # Check if already seeded
        if User.query.filter_by(username="admin").first():
            print("Database already contains seed data. Skipping.")
            return

        print("Seeding Users (Admin & Employee)...")
        admin = User(username="admin", email="admin@smartstock.io", role="ADMIN")
        admin.set_password("Admin@123")
        db.session.add(admin)

        staff = User(username="staff", email="staff@smartstock.io", role="EMPLOYEE")
        staff.set_password("Staff@123")
        db.session.add(staff)
        db.session.commit()

        print("Seeding Categories...")
        categories_data = [
            ("Electronics & Components", "Microcontrollers, sensors, ICs and circuit hardware"),
            ("Industrial Hardware", "Fasteners, stepper motors, bearings and mechanical fittings"),
            ("Raw Materials", "Sheet metals, carbon polymers and conductive copper alloys"),
            ("Packaging Supplies", "Anti-static bubble wrap, corrugated containers and pallet bands"),
            ("Office & IT Equipment", "Network switches, thermal barcode printers and terminals"),
        ]
        cat_objs = {}
        for name, desc in categories_data:
            c = Category(name=name, description=desc)
            db.session.add(c)
            cat_objs[name] = c
        db.session.commit()

        print("Seeding Suppliers...")
        suppliers_data = [
            ("Apex Global Technologies", "David Vance", "d.vance@apextech.com", "+1-555-0192", "San Jose, CA"),
            ("Nexus Industrial Supply Co", "Elena Rostova", "elena@nexusind.com", "+1-555-0348", "Chicago, IL"),
            ("Quantum Microchips Ltd", "Kenji Sato", "orders@quantumchips.io", "+81-3-5555-0143", "Tokyo, Japan"),
            ("Vanguard Packaging Solutions", "Sarah Jenkins", "sales@vanguardpack.com", "+1-555-0812", "Atlanta, GA"),
        ]
        sup_objs = {}
        for name, contact, email, phone, addr in suppliers_data:
            s = Supplier(name=name, contact_name=contact, email=email, phone=phone, address=addr)
            db.session.add(s)
            sup_objs[name] = s
        db.session.commit()

        print("Seeding Products...")
        products_data = [
            # SKU, Barcode, Name, Category, Supplier, Cost, Price, Qty, Reorder
            ("MCU-ESP32-S3", "890123450001", "ESP32-S3 Dual-Core WiFi/BLE SoC", "Electronics & Components", "Quantum Microchips Ltd", 3.20, 5.50, 140, 30),
            ("SNS-BME280-I2C", "890123450002", "BME280 Temp/Humidity/Pressure Sensor", "Electronics & Components", "Quantum Microchips Ltd", 2.10, 4.25, 18, 25),  # Low stock
            ("MOT-NEMA17-STEP", "890123450003", "NEMA-17 High-Torque Stepper Motor", "Industrial Hardware", "Nexus Industrial Supply Co", 11.50, 18.00, 65, 20),
            ("BRG-608ZZ-SKF", "890123450004", "SKF 608ZZ Precision Ball Bearings (10pk)", "Industrial Hardware", "Nexus Industrial Supply Co", 4.80, 8.90, 8, 15),   # Low stock
            ("MAT-ALU-6061-T6", "890123450005", "6061-T6 Aluminum Plate (12x12x0.25in)", "Raw Materials", "Apex Global Technologies", 18.00, 29.50, 45, 10),
            ("MAT-CU-FOIL-1M", "890123450006", "High-Purity Copper Foil Roll 0.1mm", "Raw Materials", "Apex Global Technologies", 14.50, 24.00, 4, 10),       # Low stock
            ("PKG-ESD-BAG-100", "890123450007", "Anti-Static Shielding Bags (100pk)", "Packaging Supplies", "Vanguard Packaging Solutions", 6.50, 12.00, 90, 25),
            ("PKG-CRG-BOX-M", "890123450008", "Heavy Duty Corrugated Box Medium (25pk)", "Packaging Supplies", "Vanguard Packaging Solutions", 15.00, 26.00, 0, 10),  # Out of stock
            ("DEV-PRN-THRM-4IN", "890123450009", "Industrial Thermal Barcode Printer 4-Inch", "Office & IT Equipment", "Apex Global Technologies", 145.00, 220.00, 12, 5),
            ("DEV-NET-SW-8P", "890123450010", "Gigabit Managed 8-Port PoE Switch", "Office & IT Equipment", "Apex Global Technologies", 58.00, 95.00, 22, 5),
        ]

        for sku, barcode, name, cat_name, sup_name, cost, price, qty, reorder in products_data:
            p = Product(
                sku=sku,
                barcode=barcode,
                name=name,
                category_id=cat_objs[cat_name].id,
                supplier_id=sup_objs[sup_name].id,
                cost_price=Decimal(str(cost)),
                unit_price=Decimal(str(price)),
                quantity=qty,
                reorder_level=reorder
            )
            db.session.add(p)
            db.session.flush()

            # Create an initial Stock IN transaction
            if qty > 0:
                tx = StockTransaction(
                    product_id=p.id,
                    user_id=admin.id,
                    transaction_type="IN",
                    quantity=qty,
                    unit_price=Decimal(str(cost)),
                    total_amount=round(Decimal(str(cost)) * qty, 2),
                    balance_after=qty,
                    reference_no=f"PO-INIT-{sku[:6]}",
                    notes="Initial warehouse inventory baseline intake."
                )
                db.session.add(tx)

        audit = AuditLog(
            user_id=admin.id,
            action="SYSTEM_INIT",
            resource_type="Database",
            resource_id="0",
            details="Database initialized with sample categories, suppliers, products, and baseline stock transactions."
        )
        db.session.add(audit)
        db.session.commit()
        print("Database seeded successfully with demo inventory!")

if __name__ == "__main__":
    seed_database()
