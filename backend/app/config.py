import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartstock-default-super-secret-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smartstock-jwt-super-secret-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///smartstock.db"
    )
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    PROMETHEUS_METRICS_ENABLED = os.getenv("PROMETHEUS_METRICS_ENABLED", "true").lower() == "true"
    AI_LOG_PROVIDER = os.getenv("AI_LOG_PROVIDER", "deterministic")
    AI_LOG_API_KEY = os.getenv("AI_LOG_API_KEY", "")

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"

class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
