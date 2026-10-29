"""Genera el cubo del dashboard (site/cubo.json) con DuckDB."""
import json
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
TOP_CATEGORIAS = 15

REGIONES = {
    "Sudeste": ["SP", "RJ", "MG", "ES"], "Sur": ["PR", "SC", "RS"], "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    "Nordeste": ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"], "Norte": ["AM", "RR", "AP", "PA", "TO", "RO", "AC"],
}


def construir(data_dir: Path = RAIZ / "data") -> dict:
    sql = (RAIZ / "src" / "cubo.sql").read_text().replace("{data}", str(data_dir))
    con = duckdb.connect()
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    filas = [dict(zip(cols, r)) for r in cur.fetchall()]

    # Las categorías fuera del top se agrupan en "other" para que los filtros sean manejables.
    total_cat: dict[str, float] = {}
    for f in filas:
        total_cat[f["categoria"]] = total_cat.get(f["categoria"], 0) + f["facturacion"]
    top = sorted(total_cat, key=total_cat.get, reverse=True)[:TOP_CATEGORIAS]
    agrupado: dict[tuple, list] = {}
    medidas = ["ordenes", "facturacion", "flete", "items", "tarde", "resenas", "nota_suma"]
    for f in filas:
        cat = f["categoria"] if f["categoria"] in top else "other"
        k = (f["mes"], f["estado"], cat)
        acc = agrupado.setdefault(k, [0] * len(medidas))
        for i, m in enumerate(medidas):
            acc[i] += f[m] or 0

    meses = sorted({k[0] for k in agrupado})
    estados = sorted({k[1] for k in agrupado})
    categorias = top + ["other"]
    return {
        "meses": meses,
        "estados": estados,
        "categorias": categorias,
        "regiones": REGIONES,
        "medidas": medidas,
        # filas compactas: [índice mes, índice estado, índice categoría, ...medidas]
        "filas": [[meses.index(k[0]), estados.index(k[1]), categorias.index(k[2]), *[round(v, 2) for v in vals]]
                  for k, vals in sorted(agrupado.items())],
    }


if __name__ == "__main__":
    cubo = construir()
    (RAIZ / "site" / "cubo.json").write_text(json.dumps(cubo, ensure_ascii=False, separators=(",", ":")))
    print(len(cubo["filas"]), "filas,", len(cubo["meses"]), "meses,", len(cubo["estados"]), "estados")
