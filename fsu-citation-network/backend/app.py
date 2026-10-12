from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import networkx as nx

app = Flask(__name__)
CORS(app)   
CSV_PATH = "paper_citation_links_within_fsu.csv"
# paper added for tooltip 
WORKS_CSV = "fsu_works_2021_2026.csv"   

@app.get("/api/network")
def network():
    edges = pd.read_csv(CSV_PATH, dtype=str)  

    # One link per source,target 
    # Find how many times the link repeats 
    links_df = (edges.groupby(["paper_id_1", "paper_id_2"]).size()
                .reset_index(name="value"))
    links = [{"source": s, "target": t, "value": int(v)}
             for s, t, v in links_df.itertuples(index=False)]

    # collect nodes and mark each component number 
    G = nx.from_pandas_edgelist(links_df, "paper_id_1", "paper_id_2")
    group_of = {}
    for i, comp in enumerate(nx.connected_components(G)):
        for n in comp:
            group_of[n] = i

    # Look up each paper's metadata once on the server
    works = pd.read_csv(WORKS_CSV, dtype=str).fillna("")
    works["id"] = works["openalex_id"].str.rsplit("/", n=1).str[-1]
    meta = works.set_index("id").to_dict("index")

    # Nodes now carry title, year, venue and authors 
    nodes = []
    for n in group_of:
        m = meta.get(n, {})
        nodes.append({
            "id": n,
            "group": group_of[n],
            "title": m.get("title", ""),
            "year": m.get("publication_year", ""),
            "venue": m.get("venue", ""),
            "authors": m["authors"].split("; ") if m.get("authors") else [],
            "cited_by_count": m.get("cited_by_count", ""),
        })

    return jsonify({"nodes": nodes, "links": links})

# Get rid of 404 errors 
@app.get("/")
def index():
    return "FSU citation network API. Data is at /api/network"

if __name__ == "__main__":
    app.run(port=5000, debug=True)