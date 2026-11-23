import os
from app import create_app

# WSGI entrypoint for Gunicorn or production servers
application = create_app(os.getenv("FLASK_ENV", "production"))

if __name__ == "__main__":
    application.run()
