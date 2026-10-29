# Dashboard ejecutivo de ventas

**Dashboard en vivo:** https://nbbz95.github.io/dashboard-ventas-ejecutivo/

Tablero para una gerencia comercial sobre el marketplace Olist (Brasil, ene 2017 a ago 2018): facturación, órdenes, ticket, entregas tarde, nota de reseñas y peso del flete, siempre contra un período de comparación.

## Qué tiene

- **6 KPIs con variación** contra el mismo período del año anterior, el trimestre o el mes anterior. Las tasas se comparan en puntos porcentuales, no en %.
- **Filtros** por período, región y categoría; tocar una barra de categoría también filtra. El estado de los filtros queda en la URL para compartir una vista.
- **Tendencia** con el período elegido resaltado sobre todo el histórico, ranking por categoría y por estado, y tabla de detalle con crecimiento.
- Modo claro y oscuro, tooltips en todos los gráficos y diseño usable en el celular.

## Cómo está armado ("BI as code")

1. `src/cubo.sql` arma un cubo mensual por estado y categoría con DuckDB, directo sobre los CSV.
2. Cada orden se asigna a la categoría de su ítem de mayor valor, así sumar celdas **nunca duplica órdenes**. Un test lo verifica contra el conteo real.
3. `site/assets/cubo.js` filtra y agrega el cubo en el navegador (sin dependencias). La lógica está separada del DOM y tiene tests con `node --test`.

```
src/cubo.sql            modelo del cubo (SQL)
src/build.py            genera site/cubo.json (220 KB)
site/assets/cubo.js     filtros, KPIs y variaciones
site/index.html         dashboard (HTML + SVG propio)
tests/                  pytest (el cubo cuadra con los datos) y node:test (la lógica de KPIs)
```

```bash
pip install -r requirements.txt
./scripts/descargar_datos.sh
python src/build.py
python -m pytest -q && node --test tests/*.test.mjs
python -m http.server -d site
```

**Datos:** [Olist, Brazilian E-Commerce Public Dataset](https://github.com/olist/work-at-olist-data), licencia CC BY-NC-SA 4.0.
