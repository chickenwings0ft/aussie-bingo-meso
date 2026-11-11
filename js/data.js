// ÚNICO archivo de contenido. Todo lo que se lee en la web sale de aquí:
// cabecera, etapas, casillas, instrucciones y premios.
// Para cambiar o añadir casillas, mira CLAUDE.md.

export const TRIP = {
  kicker: 'MESO ROAD TRIP · 30 NOV – 18 DIC 2026',
  title: 'AUSSIE BINGO',
  route: ['Gold Coast', 'Whitsundays', 'Byron Bay', 'Port Macquarie', 'Sídney'],
  people: 'Jugador: Meso · Árbitro: Luk',
  howToTitle: 'Cómo se juega',
  howTo:
    'Las casillas van en el orden del viaje. Luk hace de árbitro: sin foto, no cuenta. Instrucciones en la otra pestaña.',
  // Bloque «¿En qué consiste?» que se ve al principio de la web.
  introTitle: '¿En qué consiste?',
  intro: [
    'Toca una casilla para ver qué hay que hacer.',
    'Hazlo y enséñale la foto a Luk: sin foto, no cuenta.',
    'Márcala como hecha. Si te equivocas, puedes desmarcarla.',
    'Cada fila o columna completa es una LÍNEA: Luk paga una ronda.',
    'Con el cartón lleno, Luk paga la cena en Sídney. Si no lo acabas el 18 dic, pagas tú.',
  ],
  introClose: 'Entendido',
  rulesKicker: 'AUSSIE BINGO · MESO ROAD TRIP 2026',
  rulesTitle: 'INSTRUCCIONES',
  rulesNote: 'Mismo orden que el cartón',
  pdf: 'assets/Aussie_Bingo_Meso.pdf',
};

// Cuadrícula: las casillas se colocan por filas, en el orden del array CELLS.
// CELLS.length debe ser múltiplo de `columns`.
export const GRID = { columns: 5 };

// Etapas del viaje (agrupan las instrucciones).
export const STAGES = [
  { id: 'llegada', title: 'Llegada · 30 nov' },
  { id: 'whitsundays', title: 'Whitsundays · 1–3 dic' },
  { id: 'gold-coast', title: 'Gold Coast' },
  { id: 'byron', title: 'Byron Bay · 12 dic' },
  { id: 'sidney', title: 'Bajada a Sídney · hasta el 18 dic' },
];

// Premios. `line` y `full` se usan también para los avisos:
// «¡{label}! {text}».
export const PRIZES = [
  { id: 'line', label: 'LÍNEA', text: 'Luk paga una ronda' },
  { id: 'full', label: 'CARTÓN LLENO', text: 'Luk paga la cena en Sídney' },
  { id: 'unfinished', label: 'SIN ACABAR EL 18 DIC', text: 'Paga Meso' },
];

// Casillas, en el orden del cartón (y del viaje).
//   id        Clave con la que se guarda el progreso. NO cambiarla una vez publicada.
//   stage     id de una etapa de STAGES.
//   category  Etiqueta de la casilla.
//   text      Texto completo (pantallas grandes y ficha).
//   short     Título corto (móvil). Palabras de 9 letras como mucho.
//   ruleTitle / rule   Instrucción (título en negrita + texto).
//   kind      'free' = gratis, siempre marcada · 'secret' = casilla secreta.
//   note      Solo para 'free' y 'secret': subtítulo de la casilla.
export const CELLS = [
  // ── Fila 1 ──
  {
    id: 'gday',
    stage: 'llegada',
    kind: 'free',
    category: 'Gratis',
    text: 'G’DAY MESO',
    short: 'G’DAY MESO',
    note: 'Casilla gratis: has llegado',
    ruleTitle: 'G’day Meso.',
    rule: 'Gratis: ya has aterrizado en Australia.',
  },
  {
    id: 'tim-tam',
    stage: 'llegada',
    category: 'Comida',
    text: 'Hacer un Tim Tam slam',
    short: 'Tim Tam slam',
    ruleTitle: 'Tim Tam slam.',
    rule: 'Muerde dos esquinas opuestas de un Tim Tam. Moja una en un café o chocolate caliente y sorbe por la otra como si fuera una pajita. Cuando notes el líquido caliente en la boca, métetelo entero antes de que se deshaga.',
  },
  {
    id: 'vegemite',
    stage: 'llegada',
    category: 'Comida',
    text: 'Vegemite sin poner cara de asco',
    short: 'Vegemite',
    ruleTitle: 'Vegemite.',
    rule: 'Tostada caliente, bastante mantequilla y una capa finísima de Vegemite. Nunca a cucharadas.',
  },
  {
    id: 'mate',
    stage: 'llegada',
    category: 'Aussie',
    text: 'Que te llamen «mate» 3 veces en un día',
    short: '«Mate» ×3',
    ruleTitle: '«Mate» x3.',
    rule: 'Tres australianos distintos te llaman mate el mismo día. Luk no cuenta.',
  },
  {
    id: 'secreto',
    stage: 'whitsundays',
    kind: 'secret',
    category: 'Secreto',
    text: '???',
    short: '???',
    note: 'Lo sabrás cuando toque',
    ruleTitle: 'Secreto.',
    rule: 'No preguntes. Lo sabrás cuando toque.',
  },

  // ── Fila 2 ──
  {
    id: 'tortuga',
    stage: 'whitsundays',
    category: 'Arrecife',
    text: 'Ver una tortuga en el arrecife',
    short: 'Tortuga',
    ruleTitle: 'Tortuga.',
    rule: 'Tienes que estar en el agua; desde el barco no cuenta.',
  },
  {
    id: 'quemarte',
    stage: 'gold-coast',
    category: 'Playa',
    text: 'Quemarte con el sol',
    short: 'Quemarte',
    ruleTitle: 'Quemarte con el sol.',
    rule: 'No hace falta buscarlo: aquí el sol pega mucho más. Ponte SPF50 igual.',
  },
  {
    id: 'surf',
    stage: 'gold-coast',
    category: 'Surf',
    text: 'Comprar tabla + Snapper + shout-out de un aussie',
    short: 'Combo surf',
    ruleTitle: 'Combo surf.',
    rule: 'Solo cuenta con las tres: COMPRAR tabla (tuya, no alquilada), surfearla en Snapper Rocks y que un australiano te dé un shout-out por una ola. La ola es de quien está más cerca del pico: si no eres tú, no remes.',
  },
  {
    id: 'kirra',
    stage: 'gold-coast',
    category: 'Kirra',
    text: 'Chicken parmi en el Kirra Surf Club',
    short: 'Parmi en Kirra',
    ruleTitle: 'Parmi en el Kirra Surf Club.',
    rule: 'Pollo empanado con tomate, jamón y queso fundido. El clásico de pub australiano, mejor después de surfear.',
  },
  {
    id: 'frontera',
    stage: 'gold-coast',
    category: 'Frontera',
    text: 'Estar en dos husos horarios a la vez',
    short: 'Dos husos',
    ruleTitle: 'Dos husos horarios.',
    rule: 'En Point Danger (Coolangatta) pasa la frontera QLD–NSW y en diciembre hay una hora de diferencia. Un pie en cada lado.',
  },

  // ── Fila 3 ──
  {
    id: 'currumbin',
    stage: 'gold-coast',
    category: 'Currumbin',
    text: 'Ir a Currumbin Wildlife Sanctuary',
    short: 'Currumbin',
    ruleTitle: 'Currumbin Wildlife Sanctuary.',
    rule: 'Santuario con canguros y koalas. Sus koalas no valen para la casilla de koala en la naturaleza.',
  },
  {
    id: 'marketta',
    stage: 'gold-coast',
    category: 'Miami',
    text: 'Cenar en Miami Marketta',
    short: 'Miami Marketta',
    ruleTitle: 'Miami Marketta.',
    rule: 'Mercado nocturno de comida callejera con música en directo. De miércoles a sábado desde las 17:00; entrada gratis.',
  },
  {
    id: 'descalzo',
    stage: 'gold-coast',
    category: 'Aussie',
    text: 'Alguien descalzo en el súper',
    short: 'Descalzo en súper',
    ruleTitle: 'Descalzo en el súper.',
    rule: 'Alguien comprando en Woolies o Coles sin zapatos.',
  },
  {
    id: 'sausage',
    stage: 'gold-coast',
    category: 'Comida',
    text: 'Sausage sizzle en Bunnings',
    short: 'Sausage sizzle',
    ruleTitle: 'Sausage sizzle.',
    rule: 'Los fines de semana, a la entrada de Bunnings: salchicha en pan de molde con cebolla y salsa. Lo que pagas va a una asociación local.',
  },
  {
    id: 'billabong',
    stage: 'gold-coast',
    category: 'Compras',
    text: 'Comprarte un outfit entero de Billabong al 40 %',
    short: 'Outfit Billabong',
    ruleTitle: 'Outfit de Billabong.',
    rule: 'Gorra, camiseta y bañador como mínimo, todo de Billabong (marca nacida en la Gold Coast) y con al menos un 40 % de descuento.',
  },

  // ── Fila 4 ──
  {
    id: 'trinchera',
    stage: 'gold-coast',
    category: 'Noche',
    text: 'Salir con el que está agazapado en trinchera',
    short: 'Agazapado',
    ruleTitle: 'Agazapado en trinchera.',
    rule: 'Sin más pistas.',
  },
  {
    id: 'picadura',
    stage: 'gold-coast',
    category: 'Bichos',
    text: 'Picadura de algún bicho',
    short: 'Picadura',
    ruleTitle: 'Picadura.',
    rule: 'Mosquito, hormiga, medusa… lo que sea. Si es una medusa, avisa al socorrista.',
  },
  {
    id: 'tiburones',
    stage: 'byron',
    category: 'Buceo',
    text: 'Bucear con tiburones en Byron',
    short: 'Tiburones',
    ruleTitle: 'Bucear con tiburones.',
    rule: 'En Julian Rocks, frente a Byron: en verano suele haber tiburones leopardo. Vale cualquier tiburón visto bajo el agua.',
  },
  {
    id: 'pacific-ale',
    stage: 'byron',
    category: 'Byron',
    text: 'Pacific Ale en la cervecera de Byron',
    short: 'Pacific Ale',
    ruleTitle: 'Pacific Ale en la cervecera.',
    rule: 'Visita guiada reservada: sábado 12 dic, 16:00–17:30.',
  },
  {
    id: 'faro',
    stage: 'byron',
    category: 'Byron',
    text: 'Faro de Cape Byron, el punto más al este',
    short: 'Faro de Byron',
    ruleTitle: 'Faro de Cape Byron.',
    rule: 'Subir andando al faro, el punto más al este de Australia continental.',
  },

  // ── Fila 5 ──
  {
    id: 'delfines',
    stage: 'byron',
    category: 'Fauna',
    text: 'Ver delfines desde la playa o la tabla',
    short: 'Delfines',
    ruleTitle: 'Delfines.',
    rule: 'Desde la playa, el mirador o la tabla. En Byron se ven a menudo.',
  },
  {
    id: 'big-banana',
    stage: 'sidney',
    category: 'Coffs',
    text: 'Foto con la Big Banana de Coffs Harbour',
    short: 'Big Banana',
    ruleTitle: 'Big Banana.',
    rule: 'Una de las «Big Things» australianas, en Coffs Harbour. Foto obligatoria.',
  },
  {
    id: 'meat-pie',
    stage: 'sidney',
    category: 'Comida',
    text: 'Meat pie de panadería de pueblo',
    short: 'Meat pie',
    ruleTitle: 'Meat pie.',
    rule: 'En una panadería de pueblo, con tomato sauce por encima.',
  },
  {
    id: 'canguro',
    stage: 'sidney',
    category: 'Fauna',
    text: 'Un canguro salvaje (el del zoo no cuenta)',
    short: 'Canguro salvaje',
    ruleTitle: 'Canguro salvaje.',
    rule: 'En libertad, no en un parque de animales. Se ven al amanecer y al atardecer en praderas cerca de la costa.',
  },
  {
    id: 'greg',
    stage: 'sidney',
    category: 'Port Mac',
    text: 'Barbacoa con Greg',
    short: 'Barbacoa con Greg',
    ruleTitle: 'Barbacoa con Greg.',
    rule: 'En Port Macquarie. Llevad unas cervezas o un vino.',
  },

  // ── Fila 6 ──
  {
    id: 'koala',
    stage: 'sidney',
    category: 'Fauna',
    text: 'Ver un koala en la naturaleza',
    short: 'Koala',
    ruleTitle: 'Koala en la naturaleza.',
    rule: 'En un eucalipto, no en un zoo ni en un hospital de koalas. Mira arriba, en las horquillas de las ramas.',
  },
  {
    id: 'huntsman',
    stage: 'sidney',
    category: 'Bichos',
    text: 'Una huntsman o cualquier araña enorme',
    short: 'Huntsman',
    ruleTitle: 'Huntsman o araña enorme.',
    rule: 'La huntsman asusta, pero no es peligrosa. Cualquier otra araña grande: mírala de lejos y no la toques.',
  },
  {
    id: 'bicharraco',
    stage: 'sidney',
    category: 'Bichos',
    text: 'Flipar con un bicharraco nunca visto',
    short: 'Bicho nunca visto',
    ruleTitle: 'Bicharraco nunca visto.',
    rule: 'Cualquier animal que no hubieras visto en tu vida: goanna, cacatúa, murciélago gigante… De lejos y sin tocar.',
  },
  {
    id: 'bondi-coogee',
    stage: 'sidney',
    category: 'Sídney',
    text: 'De Bondi a Coogee andando',
    short: 'Bondi a Coogee',
    ruleTitle: 'Bondi a Coogee.',
    rule: 'Paseo de unos 6 km por los acantilados. Vale en cualquier sentido.',
  },
  {
    id: 'opera',
    stage: 'sidney',
    category: 'Sídney',
    text: 'Foto con la Ópera y el Harbour Bridge',
    short: 'Ópera y Bridge',
    ruleTitle: 'Ópera y Harbour Bridge.',
    rule: 'Los dos en la misma foto. Mejor desde Mrs Macquarie’s Chair o desde el ferry a Manly.',
  },
];
