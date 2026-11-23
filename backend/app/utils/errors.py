from flask import jsonify

class ValidationError(Exception):
    def __init__(self, message, errors=None):
        super().__init__(message)
        self.message = message
        self.errors = errors or {}

class InsufficientStockError(Exception):
    def __init__(self, message, available=0, requested=0):
        super().__init__(message)
        self.message = message
        self.available = available
        self.requested = requested

def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        return jsonify({
            "success": False,
            "error": "Bad Request",
            "message": e.message,
            "details": e.errors
        }), 400

    @app.errorhandler(InsufficientStockError)
    def handle_insufficient_stock(e):
        return jsonify({
            "success": False,
            "error": "Insufficient Stock",
            "message": e.message,
            "available_stock": e.available,
            "requested_quantity": e.requested
        }), 400

    @app.errorhandler(400)
    def handle_400(e):
        return jsonify({
            "success": False,
            "error": "Bad Request",
            "message": str(e.description if hasattr(e, "description") else e)
        }), 400

    @app.errorhandler(401)
    def handle_401(e):
        return jsonify({
            "success": False,
            "error": "Unauthorized",
            "message": "Valid authentication credentials are required."
        }), 401

    @app.errorhandler(403)
    def handle_403(e):
        return jsonify({
            "success": False,
            "error": "Forbidden",
            "message": "You do not have permission to access this resource."
        }), 403

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({
            "success": False,
            "error": "Not Found",
            "message": "The requested resource could not be found."
        }), 404

    @app.errorhandler(409)
    def handle_409(e):
        return jsonify({
            "success": False,
            "error": "Conflict",
            "message": str(e.description if hasattr(e, "description") else e)
        }), 409

    @app.errorhandler(500)
    def handle_500(e):
        app.logger.exception("Internal server error")
        return jsonify({
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected error occurred on the server."
        }), 500
