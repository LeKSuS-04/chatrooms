
import secrets
import requests

from dataclasses import asdict
from functools import wraps
from flask import Flask, request, redirect, send_from_directory, render_template, flash, jsonify

import db
import env
import fileutil


db.init()
app = Flask(__name__)
app.secret_key = secrets.token_hex()
app.config['MAX_CONTENT_LENGTH'] = 16 * 1000 * 1000


def require_captcha(f):
    @wraps(f)
    def route_handler(*args, **kwargs):
        def check_captcha():
            token = request.form.get('smart-token')
            user_ip = request.remote_addr
            if token is None or user_ip is None:
                return False

            resp = requests.get(
                "https://smartcaptcha.yandexcloud.net/validate",
                {
                    "secret": env.SMARTCAPTCHA_SERVER_KEY,
                    "token": token,
                    "ip": user_ip,
                },
                timeout=1
            )
            return resp.status_code == 200 and resp.json()["status"] == "ok"

        if not check_captcha():
            return abort("captcha is not solved")
        return f(*args, **kwargs)
    return route_handler


def abort(message: str):
    flash(message, "error")
    return redirect(request.path)


@app.get('/')
def index():
    return render_template(
        'index.html',
        smartcaptcha_client_key=env.SMARTCAPTCHA_CLIENT_KEY,
    )


@app.errorhandler(404)
def page_not_found(_):
    return render_template("404.html")


@app.get('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(env.UPLOAD_FOLDER, filename)


@app.post('/')
@require_captcha
def create_room():
    room_id = request.form.get('room-id')
    if room_id is None or len(room_id) < 5:
        return abort("room id must have at least 5 symbols")

    try:
        db.create_room(room_id)
    except db.RoomExistsException:
        return abort(f'room "{room_id}" already exists')
    else:
        return redirect(f'/room/{room_id}')


@app.get('/room/<room_id>')
def get_room(room_id: str):
    try:
        messages = db.get_room_messages(room_id)
    except db.RoomDoesNotExistException:
        return render_template("404.html"), 404
    else:
        return render_template(
            'room.html',
            room_id=room_id,
            messages=messages,
            smartcaptcha_client_key=env.SMARTCAPTCHA_CLIENT_KEY,
        )


@app.post('/room/<room_id>')
@require_captcha
def post_message(room_id: str):
    message = request.form.get("message", "")
    image = fileutil.save_file(request.files['file'])

    try:
        db.send_message(room_id, message, image)
    except db.RoomDoesNotExistException:
        return render_template("404.html"), 404
    return redirect(f"/room/{room_id}")


@app.get('/messages/<room_id>')
def list_messages(room_id: str):
    try:
        messages = db.get_room_messages(room_id)
    except db.RoomDoesNotExistException:
        return jsonify("room not found"), 404
    else:
        json = [asdict(msg) for msg in messages]
        return jsonify(json)


if __name__ == '__main__':
    app.run('0.0.0.0', 8000)
