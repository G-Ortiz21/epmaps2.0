const assert = require('node:assert/strict');
const fs = require('node:fs');
const { beforeEach, test } = require('node:test');
const ts = require('typescript');

process.env.EXPO_PUBLIC_API_URL = 'https://mockapi.example.invalid';
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:test-app';

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

const { ApiError } = require('../src/api/client.ts');
const {
  evaluarEstadoOficina,
  esMedidorOficina,
} = require('../src/domain/validaciones.ts');
const { buscarMedidorRemoto } = require('../src/api/medidoresApi.ts');
const {
  consultarMedidorRemotoValidado,
  interpretarConsultaMedidor,
  normalizarCodigoMedidor,
} = require('../src/hooks/useMedidorQuery.ts');

const medidorValido = {
  codigo: 'MED-123456',
  direccion: 'Calle de Ejemplo 100',
  sector: 'Centro',
  numeroCuenta: 'CTA-000123',
  estadoOficina: 'activo',
  ultimaLectura: 1250,
  fechaUltimaLectura: '2026-10-15',
  promedioMensual: 18.5,
};

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://mockapi.example.invalid';
});

function errorDeTipo(kind) {
  return (error) => error instanceof ApiError && error.kind === kind;
}

test('acepta el contrato aprobado y elimina id del tipo de negocio', async () => {
  assert.equal(esMedidorOficina({ ...medidorValido, id: 'mock-1' }), true);
  const resultado = await buscarConRespuesta([
    { ...medidorValido, id: 'mock-1', propiedadExtra: 'ignorada' },
  ]);
  assert.equal(resultado.estado, 'encontrado');
  assert.equal('id' in resultado.medidor, false);
  assert.equal('propiedadExtra' in resultado.medidor, false);
});

test('rechaza propiedades obligatorias ausentes y tipos incompatibles', () => {
  const { sector: _sector, ...sinSector } = medidorValido;
  assert.equal(esMedidorOficina(sinSector), false);
  assert.equal(esMedidorOficina({ ...medidorValido, ultimaLectura: '1250' }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, promedioMensual: -1 }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, id: 12 }), false);
});

test('acepta valores nullable y requiere fecha y lectura juntas', () => {
  assert.equal(
    esMedidorOficina({
      ...medidorValido,
      sector: null,
      numeroCuenta: null,
      ultimaLectura: null,
      fechaUltimaLectura: null,
      promedioMensual: null,
    }),
    true,
  );
  assert.equal(
    esMedidorOficina({ ...medidorValido, fechaUltimaLectura: null }),
    false,
  );
});

test('rechaza códigos de medidor inválidos y fechas de calendario inválidas', () => {
  assert.equal(esMedidorOficina({ ...medidorValido, codigo: 'MED-12345' }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, codigo: 'MED-123456\n' }), false);
  assert.equal(
    esMedidorOficina({ ...medidorValido, fechaUltimaLectura: '2026-02-30' }),
    false,
  );
  assert.equal(
    esMedidorOficina({
      ...medidorValido,
      fechaUltimaLectura: '2026-10-15\n',
    }),
    false,
  );
});

test('activo permite continuar, suspendido bloquea y un estado desconocido requiere revisión', () => {
  assert.equal(evaluarEstadoOficina('activo').permiteContinuar, true);
  assert.equal(evaluarEstadoOficina('suspendido').permiteContinuar, false);
  const desconocido = evaluarEstadoOficina('en_mantenimiento');
  assert.equal(desconocido.permiteContinuar, false);
  assert.equal(desconocido.requiereRevision, true);
});

test('la normalización recorta y unifica mayúsculas sin alterar el código', () => {
  assert.equal(normalizarCodigoMedidor('  med-123456 '), 'MED-123456');
  assert.equal(normalizarCodigoMedidor('MED-000001'), 'MED-000001');
});

test('una respuesta válida devuelve el medidor y su marca de consulta', async () => {
  await conFetch(async () => Response.json([medidorValido]), async () => {
    const resultado = await consultarMedidorRemotoValidado(medidorValido.codigo);
    assert.equal(resultado.medidor.codigo, medidorValido.codigo);
    assert.equal(resultado.medidor.direccion, medidorValido.direccion);
    assert.equal(Number.isNaN(Date.parse(resultado.consultadoEn)), false);
  });
});

test('un código inválido no llega a la red', async () => {
  let llamadas = 0;
  await conFetch(
    async () => {
      llamadas += 1;
      return Response.json([]);
    },
    async () => {
      await assert.rejects(
        consultarMedidorRemotoValidado('MED-12345'),
        TypeError,
      );
    },
  );
  assert.equal(llamadas, 0);
});

test('un medidor inexistente se informa como not_found', async () => {
  await conFetch(async () => Response.json([]), async () => {
    await assert.rejects(
      consultarMedidorRemotoValidado(medidorValido.codigo),
      errorDeTipo('not_found'),
    );
  });
});

test('una respuesta que rompe el contrato se informa como invalid_response', async () => {
  await conFetch(
    async () => Response.json([{ ...medidorValido, codigo: 45 }]),
    async () => {
      await assert.rejects(
        consultarMedidorRemotoValidado(medidorValido.codigo),
        errorDeTipo('invalid_response'),
      );
    },
  );
});

test('un fallo de red se propaga como error sin fabricar datos', async () => {
  await conFetch(
    async () => {
      throw new TypeError('network unreachable');
    },
    async () => {
      await assert.rejects(
        consultarMedidorRemotoValidado(medidorValido.codigo),
        errorDeTipo('network'),
      );
    },
  );
});

const consultaSinDatos = {
  data: undefined,
  error: null,
  isError: false,
  isPending: true,
  isStale: false,
};
const datosGuardados = {
  medidor: medidorValido,
  consultadoEn: '2026-10-28T12:00:00.000Z',
};
const contextoBase = {
  codigoNormalizado: medidorValido.codigo,
  codigoValido: true,
  enLinea: true,
  restaurando: false,
};

test('sin conexión y sin datos persistidos informa sin_cache_sin_conexion sin esperar a la red', () => {
  const lectura = interpretarConsultaMedidor(consultaSinDatos, {
    ...contextoBase,
    enLinea: false,
  });
  assert.deepEqual(lectura.resultado, {
    estado: 'sin_cache_sin_conexion',
    codigo: medidorValido.codigo,
  });
  assert.equal(lectura.cargando, false);
  assert.equal(lectura.error, null);
});

test('sin conexión, los datos persistidos se muestran como caché local', () => {
  const lectura = interpretarConsultaMedidor(
    { ...consultaSinDatos, isPending: false, data: datosGuardados },
    { ...contextoBase, enLinea: false },
  );
  assert.equal(lectura.resultado.estado, 'encontrado');
  assert.equal(lectura.resultado.origen, 'cache_local');
  assert.equal(lectura.resultado.medidor.codigo, medidorValido.codigo);
  assert.equal(lectura.error, null);
});

test('con conexión y datos frescos el origen es la oficina', () => {
  const lectura = interpretarConsultaMedidor(
    { ...consultaSinDatos, isPending: false, data: datosGuardados },
    contextoBase,
  );
  assert.equal(lectura.resultado.estado, 'encontrado');
  assert.equal(lectura.resultado.origen, 'oficina');
});

test('un error sin datos previos se informa como error comprensible', () => {
  const lectura = interpretarConsultaMedidor(
    {
      ...consultaSinDatos,
      isError: true,
      error: new ApiError('network', 'No se pudo conectar.'),
    },
    contextoBase,
  );
  assert.equal(lectura.resultado, null);
  assert.equal(typeof lectura.error, 'string');
  assert.match(lectura.error, /conexión|conectar/);
  assert.equal(lectura.cargando, false);
});

test('una actualización fallida conserva los datos anteriores y lo avisa', () => {
  const lectura = interpretarConsultaMedidor(
    {
      ...consultaSinDatos,
      isPending: false,
      isError: true,
      error: new ApiError('invalid_response', 'Contrato roto.'),
      data: datosGuardados,
    },
    contextoBase,
  );
  assert.equal(lectura.resultado.estado, 'encontrado');
  assert.equal(lectura.resultado.medidor.codigo, medidorValido.codigo);
  assert.equal(typeof lectura.avisoActualizacion, 'string');
  assert.equal(lectura.error, null);
});

test('un código inválido no presenta resultados ni carga', () => {
  const lectura = interpretarConsultaMedidor(consultaSinDatos, {
    ...contextoBase,
    codigoValido: false,
  });
  assert.deepEqual(lectura, {
    resultado: null,
    error: null,
    avisoActualizacion: null,
    cargando: false,
  });
});

test('durante la restauración se espera antes de declarar datos ausentes', () => {
  const lectura = interpretarConsultaMedidor(consultaSinDatos, {
    ...contextoBase,
    enLinea: false,
    restaurando: true,
  });
  assert.equal(lectura.resultado, null);
  assert.equal(lectura.cargando, true);
});

test('la API distingue 404 de otros errores HTTP', async () => {
  await conFetch(async () => new Response('', { status: 404 }), async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('not_found'),
    );
  });
  await conFetch(async () => new Response('', { status: 503 }), async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('http'),
    );
  });
});

test('la API distingue JSON inválido y respuesta inválida', async () => {
  await conFetch(
    async () => new Response('{invalid', { status: 200 }),
    async () => {
      await assert.rejects(
        buscarMedidorRemoto(medidorValido.codigo),
        errorDeTipo('invalid_json'),
      );
    },
  );
  await conFetch(
    async () => Response.json([{ ...medidorValido, codigo: 45 }]),
    async () => {
      await assert.rejects(
        buscarMedidorRemoto(medidorValido.codigo),
        errorDeTipo('invalid_response'),
      );
    },
  );
});

test('la API distingue errores de conexión', async () => {
  await conFetch(async () => {
    throw new TypeError('network unreachable');
  }, async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('network'),
    );
  });
});

test('la API identifica un medidor inexistente', async () => {
  await conFetch(async () => Response.json([]), async () => {
    assert.deepEqual(await buscarMedidorRemoto(medidorValido.codigo), {
      estado: 'no_encontrado',
    });
  });
});

test('la API clasifica timeout de 10 segundos', async () => {
  const setTimeoutOriginal = global.setTimeout;
  const clearTimeoutOriginal = global.clearTimeout;
  const fetchOriginal = global.fetch;
  global.setTimeout = (callback) => {
    queueMicrotask(callback);
    return 1;
  };
  global.clearTimeout = () => {};
  global.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    });

  try {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('timeout'),
    );
  } finally {
    global.setTimeout = setTimeoutOriginal;
    global.clearTimeout = clearTimeoutOriginal;
    global.fetch = fetchOriginal;
  }
});

async function buscarConRespuesta(respuesta) {
  return conFetch(
    async () => Response.json(respuesta),
    () => buscarMedidorRemoto(medidorValido.codigo),
  );
}

async function conFetch(fetchSimulado, ejecutar) {
  const fetchOriginal = global.fetch;
  global.fetch = fetchSimulado;
  try {
    return await ejecutar();
  } finally {
    global.fetch = fetchOriginal;
  }
}
