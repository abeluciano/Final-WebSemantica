FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY export_ojs_rdf.py .

CMD ["python", "export_ojs_rdf.py"]
