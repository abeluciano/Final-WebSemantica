import pymysql
from rdflib import Graph, Literal, Namespace, RDF, URIRef
from rdflib.namespace import DCTERMS, FOAF, XSD
import os
import re

# Conexión a la base de datos usando variables de entorno
connection = pymysql.connect(
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=int(os.getenv("DB_PORT", "3306")),
    user=os.getenv("DB_USER", "ojs"),
    password=os.getenv("DB_PASSWORD", ""),
    database=os.getenv("DB_NAME", "ojs"),
    cursorclass=pymysql.cursors.DictCursor
)

# Espacios de nombres
EX = Namespace("http://example.org/article/")
SCHEMA = Namespace("http://schema.org/")
BIBO = Namespace("http://purl.org/ontology/bibo/")

g = Graph()
g.bind("dct", DCTERMS)
g.bind("foaf", FOAF)
g.bind("schema", SCHEMA)
g.bind("bibo", BIBO)
g.bind("ex", EX)

# Consulta SQL
query = """
SELECT
  s.submission_id AS article_id,
  ps_title.setting_value AS title,
  ps_abstract.setting_value AS abstract,
  ps_keywords.setting_value AS keywords,
  p.date_published,
  given_name.setting_value AS given_name,
  family_name.setting_value AS family_name,
  as_orcid.setting_value AS orcid,
  ps_doi.setting_value AS doi,
  ps_url.setting_value AS url_path,
  sec_title.setting_value AS section,
  p.locale AS language,
  as_affiliation.setting_value AS affiliation
FROM
  submissions s
JOIN publications p ON s.current_publication_id = p.publication_id
LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id AND ps_title.setting_name = 'title'
LEFT JOIN publication_settings ps_abstract ON p.publication_id = ps_abstract.publication_id AND ps_abstract.setting_name = 'abstract'
LEFT JOIN publication_settings ps_keywords ON p.publication_id = ps_keywords.publication_id AND ps_keywords.setting_name = 'keywords'
LEFT JOIN authors a ON a.publication_id = p.publication_id
LEFT JOIN author_settings given_name ON a.author_id = given_name.author_id AND given_name.setting_name = 'givenName'
LEFT JOIN author_settings family_name ON a.author_id = family_name.author_id AND family_name.setting_name = 'familyName'
LEFT JOIN author_settings as_orcid ON a.author_id = as_orcid.author_id AND as_orcid.setting_name = 'orcid'
LEFT JOIN publication_settings ps_url ON p.publication_id = ps_url.publication_id AND ps_url.setting_name = 'url_path'
LEFT JOIN sections sec ON p.section_id = sec.section_id
LEFT JOIN section_settings sec_title ON sec.section_id = sec_title.section_id AND sec_title.setting_name = 'title'
LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id AND ps_doi.setting_name = 'pub-id::doi'
LEFT JOIN author_settings as_affiliation ON a.author_id = as_affiliation.author_id AND as_affiliation.setting_name = 'affiliation'
LIMIT 100;
"""

# Ejecutar la consulta y poblar el grafo RDF
with connection.cursor() as cursor:
    cursor.execute(query)
    for row in cursor.fetchall():
        article_uri = EX[str(row["article_id"])]
        g.add((article_uri, RDF.type, BIBO.Article))

        lang = (row["language"] or "en").replace("_", "-")

        if row["title"]:
            g.add((article_uri, DCTERMS.title, Literal(row["title"], lang=lang)))
        if row["abstract"]:
            g.add((article_uri, DCTERMS.abstract, Literal(row["abstract"], lang=lang)))
        if row["keywords"]:
            g.add((article_uri, DCTERMS.subject, Literal(row["keywords"])))
        if row["date_published"]:
            g.add((article_uri, DCTERMS.issued, Literal(row["date_published"], datatype=XSD.date)))
        if row["doi"]:
            g.add((article_uri, BIBO.doi, Literal(row["doi"])))
        if row["url_path"]:
            g.add((article_uri, FOAF.page, URIRef(f"http://172.29.164.75:8081/index.php/journal/article/view/{row['url_path']}")))
        if row["section"]:
            g.add((article_uri, DCTERMS.isPartOf, Literal(row["section"])))

        # Datos del autor
        if row["given_name"] or row["family_name"]:
            full_name = f"{row['given_name'] or ''} {row['family_name'] or ''}".strip()
            slug = re.sub(r'\W+', '_', full_name)
            author_uri = URIRef(f"http://example.org/person/{slug}")
            g.add((article_uri, DCTERMS.creator, author_uri))
            g.add((author_uri, RDF.type, FOAF.Person))
            g.add((author_uri, FOAF.name, Literal(full_name)))
            if row["orcid"]:
                g.add((author_uri, FOAF.isPrimaryTopicOf, URIRef(f"https://orcid.org/{row['orcid']}")))
            if row["affiliation"]:
                g.add((author_uri, SCHEMA.affiliation, Literal(row["affiliation"])))

# Guardar como archivo .ttl
output_path = "/app/output/ojs_articles.ttl"
os.chmod(output_path, 0o664)
g.serialize(output_path, format="turtle")
print(f"✔ Archivo RDF exportado correctamente en: {output_path}")

# Cerrar conexión
connection.close()
