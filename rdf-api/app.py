from fastapi import FastAPI, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from SPARQLWrapper import SPARQLWrapper, JSON

app = FastAPI()

# CORS para todos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FUSEKI_URL = "http://fuseki_ojs:3030/ojs/sparql"

def run_query(query_str):
    sparql = SPARQLWrapper(FUSEKI_URL)
    sparql.setQuery(query_str)
    sparql.setReturnFormat(JSON)
    return sparql.query().convert()["results"]["bindings"]

@app.get("/articulos")
def obtener_articulos(autor: str = Query(None)):
    query = """
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?title ?authorName ?doi WHERE {
      ?article a bibo:Article ;
               dct:title ?title ;
               dct:creator ?author .
      ?author foaf:name ?authorName .
      OPTIONAL { ?article bibo:doi ?doi . }
    """
    if autor:
        query += f'FILTER(CONTAINS(LCASE(?authorName), "{autor.lower()}"))'
    query += "} LIMIT 100"

    results = run_query(query)
    return [
        {
            "titulo": r["title"]["value"],
            "autor": r["authorName"]["value"],
            "doi": r.get("doi", {}).get("value", "")
        }
        for r in results
    ]

@app.get("/articulos_institucion")
def buscar_por_institucion(inst: str = Query(...)):
    query = f"""
    PREFIX schema: <http://schema.org/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT ?title ?doi ?authorName ?inst WHERE {{
      ?article a bibo:Article ;
               dct:creator ?author ;
               dct:title ?title ;
               bibo:doi ?doi .
      ?author foaf:name ?authorName ;
              schema:affiliation ?inst .
      FILTER(CONTAINS(LCASE(?inst), "{inst.lower()}"))
    }} LIMIT 100
    """
    results = run_query(query)
    return [
        {
            "titulo": r["title"]["value"],
            "doi": r["doi"]["value"],
            "autor": r["authorName"]["value"],
            "institucion": r["inst"]["value"]
        }
        for r in results
    ]

@app.get("/relacionados")
def articulos_relacionados(doi: str = Query(...)):
    query = f"""
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?relTitle ?relDoi WHERE {{
      ?art1 a bibo:Article ;
            bibo:doi "{doi}" ;
            dct:subject ?tema .
      ?rel a bibo:Article ;
           bibo:doi ?relDoi ;
           dct:subject ?tema ;
           dct:title ?relTitle .
      FILTER(?relDoi != "{doi}")
    }} LIMIT 10
    """
    results = run_query(query)
    return [{"titulo": r["relTitle"]["value"], "doi": r["relDoi"]["value"]} for r in results]

@app.get("/secciones_mas_activas")
def secciones_activas():
    query = """
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?seccion (COUNT(?article) AS ?cantidad) WHERE {
      ?article a bibo:Article ;
               dct:isPartOf ?seccion .
    }
    GROUP BY ?seccion
    ORDER BY DESC(?cantidad)
    LIMIT 10
    """
    results = run_query(query)
    return [{"seccion": r["seccion"]["value"], "cantidad": r["cantidad"]["value"]} for r in results]


@app.get("/autores_top")
def autores_mas_publicadores():
    query = """
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?autor (COUNT(?article) AS ?publicaciones) WHERE {
      ?article a bibo:Article ;
               dct:creator ?a .
      ?a foaf:name ?autor .
    }
    GROUP BY ?autor
    ORDER BY DESC(?publicaciones)
    LIMIT 10
    """
    results = run_query(query)
    return [{"autor": r["autor"]["value"], "publicaciones": r["publicaciones"]["value"]} for r in results]


@app.get("/autores")
def lista_autores():
    query = """
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT DISTINCT ?autor WHERE {
      ?person a foaf:Person ;
              foaf:name ?autor .
    }
    ORDER BY ?autor
    """
    results = run_query(query)
    return [r["autor"]["value"] for r in results]

@app.get("/articulo/")
def buscar_articulo_por_doi(doi: str = Query(...)):
    sparql = SPARQLWrapper("http://fuseki_ojs:3030/ojs/sparql")
    sparql.setReturnFormat(JSON)

    query = f"""
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?article ?title ?authorName ?abstract ?url WHERE {{
      ?article a bibo:Article ;
               dct:title ?title ;
               dct:abstract ?abstract ;
               foaf:page ?url ;
               dct:creator ?author ;
               bibo:doi ?doiValue .
      ?author foaf:name ?authorName .
      FILTER(STR(?doiValue) = STR("{doi}"))
    }} LIMIT 1
    """

    sparql.setQuery(query)
    results = sparql.query().convert()["results"]["bindings"]
    if not results:
        return {"error": f"Artículo con DOI '{doi}' no encontrado"}
    
    r = results[0]
    return {
        "uri": r["article"]["value"],
        "titulo": r["title"]["value"],
        "autor": r["authorName"]["value"],
        "resumen": r["abstract"]["value"],
        "url": r["url"]["value"]
    }


@app.get("/secciones")
def obtener_secciones():
    query = """
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT DISTINCT ?seccion WHERE {
      ?article a bibo:Article ;
               dct:isPartOf ?seccion .
    }
    ORDER BY ?seccion
    """
    results = run_query(query)
    return [r["seccion"]["value"] for r in results]

@app.get("/articulos_keywords")
def buscar_por_keywords(kw: str = Query(...)):
    query = f"""
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>

    SELECT ?title ?doi ?keywords WHERE {{
      ?article a bibo:Article ;
               dct:title ?title ;
               dct:subject ?keywords ;
               bibo:doi ?doi .
      FILTER(CONTAINS(LCASE(?keywords), "{kw.lower()}"))
    }} LIMIT 50
    """
    results = run_query(query)
    return [
        {
            "titulo": r["title"]["value"],
            "doi": r["doi"]["value"],
            "keywords": r["keywords"]["value"]
        }
        for r in results
    ]
