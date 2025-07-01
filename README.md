# 🧠 OJS + RDF Exporter + Fuseki + Frontend (React)

Este proyecto integra un stack completo para exponer metadatos de artículos científicos desde **Open Journal Systems (OJS)** en formato **RDF**, utilizando:
- 📦 OJS + MariaDB (publicación de artículos)
- 🐍 Exportador RDF en Python
- 🧠 Apache Jena Fuseki (triple store)
- ⚙️ API en FastAPI para consultas SPARQL
- 🌐 Frontend interactivo en React

---

## 🔧 Requisitos previos

- Docker
- Docker Compose
- Git

---

## 🚀 Cómo levantar el sistema

### 1. Clona este repositorio

```bash
git clone https://github.com/abeluciano/Final-WebSemantica.git
cd Final-WebSemantica
````

### 2. Copia el archivo de entorno

```bash
cp .env.example .env
```

### 3. Da permisos a los volúmenes (solo si usas Linux)

```bash
sudo chown 100:101 ./volumes -R
sudo chown 999:999 ./volumes/db -R
chmod -R 777 fuseki/dataset
chmod -R 777 rdf-output
```

Esto permite que los contenedores `ojs`, `mariadb`, `rdf-exporter` y `fuseki` puedan leer/escribir.

### 4. Levanta todos los servicios

```bash
docker compose up --build -d
```

---

## 🌐 Acceso a los servicios

| Servicio         | URL                                                                  |
| ---------------- | -------------------------------------------------------------------- |
| 📰 OJS           | [http://localhost:8081](http://localhost:8081)                       |
| 🔄 API FastAPI   | [http://localhost:8000](http://localhost:8000)                       |
| 🧠 Fuseki SPARQL | [http://localhost:3030/ojs/sparql](http://localhost:3030/ojs/sparql) |

---

## 📁 Estructura del proyecto

```
Final-WebSemantica/
│
├── docker-compose.yml
├── .env.example
│
├── volumes/              # Volúmenes de OJS y DB
├── fuseki/               # Configuración y dataset de Fuseki
├── rdf-exporter/         # Exportador RDF en Python
├── rdf-api/              # API SPARQL en FastAPI
├── frontend/             # Frontend interactivo en React
└── rdf-output/           # Archivo .ttl generado por el exporter
```

---

## 📋 Funcionalidades

* ✅ Exportación automática de artículos desde OJS como RDF (Turtle)
* ✅ Carga en Fuseki para consultas SPARQL
* ✅ API REST para consultar:

  * Artículos por autor, palabra clave, afiliación
  * Autores y secciones más frecuentes
  * Artículos relacionados semánticamente
* ✅ Frontend con visualización básica de artículos (lista)
* 🔄 \[En desarrollo] Visualización gráfica de relaciones con D3.js
* 🔗 Enlaces con fuentes externas (ORCID, DBpedia)

---

## 📝 Notas

* El archivo `ojs_articles.ttl` se genera automáticamente por el contenedor `rdf-exporter` y se coloca en `fuseki/dataset/`
* Fuseki lo carga al iniciar como dataset llamado `ojs`
* Puedes editar artículos en OJS y volver a correr el exporter para actualizar el dataset

```bash
docker compose run --rm rdf_exporter
```

---
