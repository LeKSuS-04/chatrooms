import sqlite3

from dataclasses import dataclass

import env


@dataclass
class Message:
    message: str
    image_file: str | None


class RoomExistsException(ValueError):
    ...

class RoomDoesNotExistException(ValueError):
    ...


def get_connection():
    return sqlite3.connect(env.DB_PATH, check_same_thread=False)


def init():
    with get_connection() as c:
        c.execute('''
            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                room_id TEXT NOT NULL,
                message TEXT,
                image_file TEXT,

                FOREIGN KEY (room_id) REFERENCES rooms (id)
            )
        ''')


def create_room(room_id: str):
    try:
        with get_connection() as c:
            c.execute("INSERT INTO rooms(id) VALUES (?)", (room_id, ))
    except sqlite3.IntegrityError:
        raise RoomExistsException("room already exists")


def ensure_room_exists(room_id: str):
    with get_connection() as c:
        cur = c.cursor()
        cur.execute("SELECT * FROM rooms WHERE id = ?", (room_id, ))
        rows = cur.fetchall()
        if len(rows) == 0:
            raise RoomDoesNotExistException("room does not exist")


def send_message(room_id: str, message: str, image_id: str | None):
    ensure_room_exists(room_id)

    with get_connection() as c:
        c.execute(
            "INSERT INTO messages (room_id, message, image_file) VALUES (?, ?, ?)",
            (room_id, message, image_id),
        )


def get_room_messages(room_id: str) -> list[Message]:
    ensure_room_exists(room_id)

    with get_connection() as c:
        cur = c.cursor()
        cur.execute("SELECT message, image_file FROM messages WHERE room_id = ?", (room_id, ))
        rows = cur.fetchall()
        messages = [Message(*row) for row in rows]
    return messages
