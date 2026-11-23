FROM node:20-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/*.py ./
COPY --from=web /web/dist ./dist
USER nobody
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
