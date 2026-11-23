from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.utils.errors import ValidationError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "EMPLOYEE").upper()

    if not username or len(username) < 3:
        raise ValidationError("Username is required and must be at least 3 characters.")
    if not email or "@" not in email:
        raise ValidationError("A valid email address is required.")
    if not password or len(password) < 6:
        raise ValidationError("Password must be at least 6 characters long.")

    if role not in ["ADMIN", "EMPLOYEE"]:
        role = "EMPLOYEE"

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "error": "Conflict", "message": f"Username '{username}' is already taken."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "Conflict", "message": f"Email '{email}' is already registered."}), 409

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"username": user.username, "role": user.role, "email": user.email}
    )

    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "token": token,
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("username", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        raise ValidationError("Username/email and password are required.")

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Unauthorized", "message": "Invalid username or password."}), 401

    if not user.is_active:
        return jsonify({"success": False, "error": "Forbidden", "message": "This user account has been disabled."}), 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"username": user.username, "role": user.role, "email": user.email}
    )

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"success": False, "error": "Not Found", "message": "User not found."}), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200
