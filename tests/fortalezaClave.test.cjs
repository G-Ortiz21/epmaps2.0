const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (modulo, nombreArchivo) => {
  const codigo = fs.readFileSync(nombreArchivo, 'utf8');
  const salida = ts.transpileModule(codigo, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  modulo._compile(salida, nombreArchivo);
};

const { evaluarFortaleza } = require('../src/domain/fortalezaClave.ts');

test('claves con menos de ocho caracteres siempre son débiles', () => {
  assert.equal(evaluarFortaleza('Aa1!xyz'), 'debil');
});

test('una clave de ocho caracteres no recibe el punto por longitud', () => {
  assert.equal(evaluarFortaleza('Abcdefg1'), 'debil');
});

test('tres criterios alcanzan fortaleza media', () => {
  assert.equal(evaluarFortaleza('Abcdefg1!'), 'media');
});

test('largo, mayúscula y minúscula, dígito y símbolo alcanzan fortaleza fuerte', () => {
  assert.equal(evaluarFortaleza('Abcdefghij1!'), 'fuerte');
});

test('el símbolo puntúa con signos Unicode', () => {
  assert.equal(evaluarFortaleza('Abcdefg1¿'), 'media');
});
