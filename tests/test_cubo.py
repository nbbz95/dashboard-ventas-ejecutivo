import sys
from pathlib import Path

import duckdb
import pytest

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "src"))
from build import construir  # noqa: E402


@pytest.fixture(scope="session")
def cubo():
    return construir()


def total(cubo, medida):
    i = 3 + cubo["medidas"].index(medida)
    return sum(f[i] for f in cubo["filas"])


def test_ordenes_no_se_duplican(cubo):
    d = RAIZ / "data"
    esperado = duckdb.connect().execute(f"""
        select count(distinct o.order_id)
        from read_csv('{d}/olist_orders_dataset.csv', header = true) o
        join read_csv('{d}/olist_order_items_dataset.csv', header = true) i using (order_id)
        where o.order_status = 'delivered'
          and o.order_purchase_timestamp >= '2017-01-01' and o.order_purchase_timestamp < '2018-09-01'
    """).fetchone()[0]
    assert total(cubo, "ordenes") == esperado


def test_facturacion_cuadra_con_items(cubo):
    d = RAIZ / "data"
    esperado = duckdb.connect().execute(f"""
        select sum(i.price + i.freight_value)
        from read_csv('{d}/olist_orders_dataset.csv', header = true) o
        join read_csv('{d}/olist_order_items_dataset.csv', header = true) i using (order_id)
        where o.order_status = 'delivered'
          and o.order_purchase_timestamp >= '2017-01-01' and o.order_purchase_timestamp < '2018-09-01'
    """).fetchone()[0]
    assert total(cubo, "facturacion") == pytest.approx(esperado, rel=1e-6)


def test_dimensiones(cubo):
    assert cubo["meses"][0] == "2017-01" and cubo["meses"][-1] == "2018-08"
    assert cubo["categorias"][-1] == "other" and len(cubo["categorias"]) == 16
    estados_en_regiones = {e for es in cubo["regiones"].values() for e in es}
    assert set(cubo["estados"]) <= estados_en_regiones
    assert total(cubo, "tarde") <= total(cubo, "ordenes")
