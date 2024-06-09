import os

DB_PATH = os.getenv("DB_PATH", "./data/rooms.db")
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./data/uploads")
SMARTCAPTCHA_SERVER_KEY = os.getenv("SMARTCAPTCHA_SERVER_KEY")
SMARTCAPTCHA_CLIENT_KEY = os.getenv("SMARTCAPTCHA_CLIENT_KEY")
