FROM python:3.11-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
COPY main.py .
RUN uv pip install --system fastapi "uvicorn[standard]" pydantic anthropic
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
