from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def role_required(*allowed_roles):
    """
    Decorator to ensure user has one of the allowed roles (e.g., ADMIN, EMPLOYEE)
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role", "EMPLOYEE")
            if role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": "Forbidden",
                    "message": f"Action requires one of the following roles: {', '.join(allowed_roles)}. Your role is '{role}'."
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def admin_required():
    return role_required("ADMIN")
