# SmartStock RESTful API Reference Specification

All endpoints communicate via JSON over standard HTTP/HTTPS unless exporting files (e.g. CSV).  
Protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Method / URL**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "username": "jdoe",
    "email": "jdoe@smartstock.io",
    "password": "Password123!",
    "role": "EMPLOYEE"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 3,
      "username": "jdoe",
      "email": "jdoe@smartstock.io",
      "role": "EMPLOYEE",
      "is_active": true
    }
  }
  ```

### 1.2 Login & Token Issue
- **Method / URL**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "Admin@123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "admin", "role": "ADMIN" }
  }
  ```

### 1.3 Get Current User Profile
- **Method / URL**: `GET /api/auth/me`
- **Access**: Authenticated (`ADMIN` or `EMPLOYEE`)

---

## 2. Product & Inventory Endpoints (`/api/products`)

### 2.1 List Products (Paginated & Filtered)
- **Method / URL**: `GET /api/products`
- **Query Parameters**:
  - `page`: Integer (default 1)
  - `per_page`: Integer (default 10, max 100)
  - `q`: Search string for SKU, name, or barcode
  - `category_id`: Filter by category integer ID
  - `supplier_id`: Filter by supplier integer ID
  - `stock_status`: `IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`
  - `sort_by`: Column name (`name`, `quantity`, `cost_price`)
  - `order`: `asc` | `desc`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "sku": "MCU-ESP32-S3",
        "barcode": "890123450001",
        "name": "ESP32-S3 Dual-Core WiFi/BLE SoC",
        "category_id": 1,
        "category_name": "Electronics & Components",
        "cost_price": 3.20,
        "unit_price": 5.50,
        "quantity": 140,
        "reorder_level": 30,
        "is_low_stock": false,
        "stock_status": "IN_STOCK",
        "total_value": 448.00
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total_items": 10,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
  ```

### 2.2 Low Stock Alert List
- **Method / URL**: `GET /api/products/low-stock`
- **Description**: Returns all catalog items where `quantity <= reorder_level`.

### 2.3 Export Inventory CSV
- **Method / URL**: `GET /api/products/export/csv`
- **Response**: `text/csv` stream with header `Content-Disposition: attachment;filename=smartstock_inventory_report.csv`.

### 2.4 Create Product
- **Method / URL**: `POST /api/products`
- **Access**: Authenticated (`ADMIN` or `EMPLOYEE`)

### 2.5 Delete Product
- **Method / URL**: `DELETE /api/products/<id>`
- **Access**: `ADMIN` role only. Employees receive `403 Forbidden`.

---

## 3. Atomic Stock Movement Endpoints (`/api/stock`)

### 3.1 Stock IN (Warehouse Intake)
- **Method / URL**: `POST /api/stock/in`
- **Request Body**:
  ```json
  {
    "product_id": 2,
    "quantity": 25,
    "unit_price": 2.10,
    "reference_no": "PO-892102",
    "notes": "Intake from Tokyo distributor"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Stock IN successful. Added 25 units to BME280 Sensor.",
    "transaction": {
      "id": 11,
      "transaction_type": "IN",
      "quantity": 25,
      "balance_after": 43,
      "reference_no": "PO-892102"
    }
  }
  ```

### 3.2 Stock OUT (Order Fulfillment / Negative Prevention)
- **Method / URL**: `POST /api/stock/out`
- **Request Body**:
  ```json
  {
    "product_id": 2,
    "quantity": 100,
    "reference_no": "SO-441200"
  }
  ```
- **Error Response if Quantity > Available (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "Insufficient Stock",
    "message": "Cannot dispense 100 units. Only 43 units are currently available for product 'BME280 Sensor' (SKU: SNS-BME280-I2C).",
    "available_stock": 43,
    "requested_quantity": 100
  }
  ```

### 3.3 Transaction Audit Ledger
- **Method / URL**: `GET /api/stock/transactions`
- **Query Parameters**: `page`, `per_page`, `type` (`IN` | `OUT`), `product_id`.

---

## 4. Analytics & Telemetry Endpoints (`/api/analytics`, `/metrics`)

### 4.1 Summary KPIs
- **Method / URL**: `GET /api/analytics/summary`
- **Returns**: Total products, stock units, inventory valuation in USD, low stock counts, and transactions count.

### 4.2 Chart Breakdown
- **Method / URL**: `GET /api/analytics/charts`
- **Returns**: Category distribution with values, top 5 value products, and stock movement flow.

### 4.3 Prometheus Metrics
- **Method / URL**: `GET /metrics`
- **Format**: Prometheus text format (`CONTENT_TYPE_LATEST`).

---

## 5. Health & Bonus AI Endpoints

### 5.1 Liveness Probe
- **Method / URL**: `GET /healthz`
- **Response**: `200 OK` `{"status": "healthy", "service": "smartstock-backend"}`

### 5.2 Readiness Probe
- **Method / URL**: `GET /ready`
- **Response**: `200 OK` `{"status": "ready", "database": "connected"}`

### 5.3 AI Log Diagnosis
- **Method / URL**: `POST /api/ai/diagnose-log`
- **Request Body**: `{"log": "psycopg2.OperationalError: Connection refused on port 5432"}`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "diagnosis": {
      "matched": true,
      "severity": "CRITICAL",
      "category": "DATABASE_CONNECTIVITY",
      "title": "PostgreSQL Connection Failure",
      "root_cause": "The backend service is unable to connect to PostgreSQL...",
      "remediation": [
        "Verify PostgreSQL status using: docker compose ps postgres",
        "Inspect database container logs: docker compose logs -f postgres"
      ]
    }
  }
  ```
