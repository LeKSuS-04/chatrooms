import os
import secrets

from werkzeug.datastructures import FileStorage

import env


def with_ext(name: str, ext: str) -> str:
    return f'{name}.{ext}'


def upload_path(image_name: str) -> str:
    return os.path.join(env.UPLOAD_FOLDER, image_name)


def image_exists(image_name: str) -> bool:
    return os.path.exists(upload_path(image_name))


def save_file(file: FileStorage) -> str | None:
    if file.filename is None or len(file.filename) < 3 or not file.mimetype.startswith('image/'):
        return None

    ext = file.filename.lower().split('.')[-1]
    name = secrets.token_hex()
    while image_exists(with_ext(name, ext)):
        name = secrets.token_hex()

    file.save(upload_path(with_ext(name, ext)))

    return with_ext(name, ext)
