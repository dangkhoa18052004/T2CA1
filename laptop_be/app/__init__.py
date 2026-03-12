import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from .extensions import db
from .routes.api import api_bp

def create_app():
    # Nạp biến môi trường từ file .env
    load_dotenv()

    app = Flask(__name__)
    
    # Cấu hình từ file .env thông qua os.getenv
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")

    # BẮT BUỘC: Cho phép Frontend truy cập (Sửa lỗi Network Error)
    CORS(app)

    # KHÔNG dùng app.config.from_pyfile("../.env") ở đây vì sẽ gây lỗi Syntax

    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.get("/health")
    def health():
        return {"ok": True, "message": "Backend is running"}

    return app