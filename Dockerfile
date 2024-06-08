FROM python:3.12.3

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ .

ENTRYPOINT [ "gunicorn", "main:app", "--workers=4", "-b", "0.0.0.0:80" ]
