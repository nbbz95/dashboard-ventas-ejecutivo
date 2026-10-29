import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const Cubo = require("../site/assets/cubo.js");

const cubo = {
  meses: ["2018-01", "2018-02"],
  estados: ["SP", "RJ"],
  categorias: ["a", "b"],
  // mes, estado, categoría, ordenes, facturacion, flete, items, tarde, resenas, nota_suma
  filas: [
    [0, 0, 0, 10, 1000, 100, 12, 1, 10, 45],
    [0, 1, 1, 5, 500, 80, 5, 2, 4, 12],
    [1, 0, 0, 20, 2400, 200, 22, 2, 20, 90],
  ],
};

test("kpis del total", () => {
  const k = Cubo.kpis(cubo.filas);
  assert.equal(k.facturacion, 3900);
  assert.equal(k.ordenes, 35);
  assert.equal(k.ticket, 3900 / 35);
  assert.equal(k.tardePct, 5 / 35);
  assert.equal(k.nota, 147 / 34);
});

test("filtros por período, estado y categoría", () => {
  assert.equal(Cubo.filtrar(cubo, { rango: [0, 0] }).length, 2);
  assert.equal(Cubo.filtrar(cubo, { rango: [0, 1], estados: ["RJ"] }).length, 1);
  assert.equal(Cubo.filtrar(cubo, { rango: [0, 1], categoria: 0 }).length, 2);
});

test("variación contra el período anterior", () => {
  assert.equal(Cubo.variacion(120, 100).toFixed(2), "0.20");
  assert.equal(Cubo.variacion(5, 0), null);
  assert.equal(Cubo.variacion(null, 3), null);
});

test("ranking por dimensión ordena por facturación", () => {
  const r = Cubo.porDimension(cubo.filas, 1, cubo.estados);
  assert.deepEqual(r.map((x) => x.clave), ["SP", "RJ"]);
  assert.equal(r[0].facturacion, 3400);
});

test("serie mensual completa el rango", () => {
  const s = Cubo.serieMensual(cubo, cubo.filas, [0, 1]);
  assert.deepEqual(s.map((x) => x.mes), ["2018-01", "2018-02"]);
  assert.equal(s[1].ordenes, 20);
});

test("el cubo publicado es consistente", () => {
  const real = JSON.parse(readFileSync(new URL("../site/cubo.json", import.meta.url)));
  const periodos = Cubo.periodos(real.meses);
  for (const p of periodos) {
    assert.ok(p.rango[0] >= 0 && p.rango[1] < real.meses.length, p.id);
    if (p.comp) assert.ok(p.comp[0] >= 0, p.id);
  }
  const k = Cubo.kpis(real.filas);
  assert.ok(k.ordenes > 90000 && k.ordenes < 100000);
  assert.ok(k.nota > 3.5 && k.nota < 5);
});
