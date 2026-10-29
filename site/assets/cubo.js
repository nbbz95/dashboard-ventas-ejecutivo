// Lógica del dashboard sin DOM: filtra el cubo y calcula KPIs. Se testea con node --test.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Cubo = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Períodos: rango de meses actual y rango de comparación (índices inclusive sobre cubo.meses).
  function periodos(meses) {
    const i = (m) => meses.indexOf(m);
    const last = meses.length - 1;
    return [
      { id: "ytd", nombre: "2018 (ene-ago)", rango: [i("2018-01"), i("2018-08")], comp: [i("2017-01"), i("2017-08")], compNombre: "mismo período 2017" },
      { id: "q", nombre: "Último trimestre", rango: [last - 2, last], comp: [last - 5, last - 3], compNombre: "trimestre anterior" },
      { id: "m", nombre: "Último mes", rango: [last, last], comp: [last - 1, last - 1], compNombre: "mes anterior" },
      { id: "2017", nombre: "2017", rango: [i("2017-01"), i("2017-12")], comp: null },
      { id: "all", nombre: "Todo", rango: [0, last], comp: null },
    ];
  }

  function filtrar(cubo, { rango, estados = null, categoria = null }) {
    const est = estados ? new Set(estados.map((e) => cubo.estados.indexOf(e))) : null;
    return cubo.filas.filter((f) => f[0] >= rango[0] && f[0] <= rango[1] &&
      (!est || est.has(f[1])) && (categoria == null || f[2] === categoria));
  }

  // Medidas en el orden de cubo.medidas: ordenes, facturacion, flete, items, tarde, resenas, nota_suma
  function sumar(filas) {
    const t = [0, 0, 0, 0, 0, 0, 0];
    for (const f of filas) for (let k = 0; k < 7; k++) t[k] += f[3 + k];
    return t;
  }

  function kpis(filas) {
    const [ordenes, facturacion, flete, items, tarde, resenas, notaSuma] = sumar(filas);
    return {
      facturacion,
      ordenes,
      ticket: ordenes ? facturacion / ordenes : null,
      tardePct: ordenes ? tarde / ordenes : null,
      nota: resenas ? notaSuma / resenas : null,
      fletePct: facturacion ? flete / facturacion : null,
      itemsPorOrden: ordenes ? items / ordenes : null,
    };
  }

  function variacion(actual, previo) {
    if (actual == null || previo == null || previo === 0) return null;
    return actual / previo - 1;
  }

  function porDimension(filas, dim, nombres) {
    const acc = new Map();
    for (const f of filas) {
      const k = f[dim];
      if (!acc.has(k)) acc.set(k, []);
      acc.get(k).push(f);
    }
    return [...acc.entries()].map(([k, fs]) => ({ clave: nombres[k], indice: k, ...kpis(fs) }))
      .sort((a, b) => b.facturacion - a.facturacion);
  }

  function serieMensual(cubo, filas, rango) {
    const out = [];
    for (let m = rango[0]; m <= rango[1]; m++) out.push({ mes: cubo.meses[m], ...kpis(filas.filter((f) => f[0] === m)) });
    return out;
  }

  return { periodos, filtrar, sumar, kpis, variacion, porDimension, serieMensual };
});
