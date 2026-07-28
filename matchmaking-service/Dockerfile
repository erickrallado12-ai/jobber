FROM python:3.12-slim AS runtime

WORKDIR /app

COPY matchmaking-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY matchmaking-service/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
