import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product

@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(autouse=True)
def clean_db(app):
    with app.app_context():
        # Clear tables before each test
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()
    yield

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_user(app):
    with app.app_context():
        admin = User(username="admin_test", email="admin_test@smartstock.io", role="ADMIN")
        admin.set_password("AdminPass123!")
        db.session.add(admin)
        db.session.commit()
        return admin

@pytest.fixture
def employee_user(app):
    with app.app_context():
        emp = User(username="employee_test", email="emp_test@smartstock.io", role="EMPLOYEE")
        emp.set_password("EmpPass123!")
        db.session.add(emp)
        db.session.commit()
        return emp

@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "AdminPass123!"
    })
    return resp.get_json()["token"]

@pytest.fixture
def employee_token(client, employee_user):
    resp = client.post("/api/auth/login", json={
        "username": "employee_test",
        "password": "EmpPass123!"
    })
    return resp.get_json()["token"]

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}

@pytest.fixture
def sample_product(app, admin_user):
    with app.app_context():
        category = Category(name="Sensors", description="Sensor electronics")
        supplier = Supplier(name="Apex Supplies", email="contact@apex.com")
        db.session.add_all([category, supplier])
        db.session.commit()

        product = Product(
            sku="SKU-SNS-001",
            barcode="789012345678",
            name="Digital Temperature Sensor",
            category_id=category.id,
            supplier_id=supplier.id,
            cost_price=5.00,
            unit_price=12.50,
            quantity=50,
            reorder_level=15
        )
        db.session.add(product)
        db.session.commit()
        return product.id
