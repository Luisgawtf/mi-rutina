// =====================================================================
// BIBLIOTECA DE EJERCICIOS + PLAN
// Editable a mano. La app lee todo de aquí.
//   cat:  fuerza | calistenia | plio | cardio | movilidad | prevencion
//   pri:  músculos principales (cuentan 1 serie)
//   sec:  músculos secundarios (cuentan 0,5 series)  -> conteo fraccionario (Pelland 2024)
//   est:  true = carga alta en posición estirada (🔶, más hipertrofia según evidencia)
//   med:  cómo se registra: reps | seg | cardio | check
// =====================================================================

const MUSCULOS = {
  cuad: "Cuádriceps", isquio: "Isquios", gluteo: "Glúteos", aductor: "Aductores",
  gemelo: "Gemelos/sóleo", tibial: "Tibial", pecho: "Pecho", dorsal: "Dorsal",
  espalda_alta: "Espalda alta/trapecio", delt_ant: "Deltoides anterior",
  delt_lat: "Deltoides lateral", delt_post: "Deltoides posterior",
  biceps: "Bíceps", triceps: "Tríceps", antebrazo: "Antebrazo/agarre", core: "Core",
  lumbar: "Lumbares/erectores",
};

// Músculos que tú tienes como débiles (cifosis postural): la pestaña Volumen los marca
// y el plan les da más series y los pone antes en la sesión.
const PRIORIDAD = ["espalda_alta", "delt_post", "delt_lat", "lumbar", "isquio", "gluteo"];

// Objetivo de series fraccionarias/semana (hipertrofia). min = mínimo útil, max = techo razonable.
const OBJETIVO_SERIES = { min: 10, max: 20 };

function E(id, nombre, cat, equipo, pri, sec, extra) {
  return Object.assign({ id, nombre, cat, equipo, pri, sec, est: false, med: "reps", tecnica: "", porque: "", alt: [] }, extra);
}

const EJERCICIOS = [
  // ---------------- PIERNA: CUÁDRICEPS / GLÚTEO ----------------
  E("sentadilla", "Sentadilla con barra", "fuerza", "barra", ["cuad", "gluteo"], ["aductor", "core"], { est: true,
    tecnica: "Barra en trapecio, pies a la anchura de hombros, baja hasta romper el paralelo con el tronco firme y las rodillas siguiendo la punta de los pies.",
    porque: "El básico de pierna con más estudios. Profunda hace crecer el glúteo y el aductor unas 3 veces más que la media sentadilla (Kubo 2019). Casi no trabaja los isquios: para eso el plan tiene RDL, curl femoral y nórdico.",
    alt: ["sentadilla_frontal", "sentadilla_hack", "prensa", "sentadilla_goblet"] }),
  E("sentadilla_frontal", "Sentadilla frontal", "fuerza", "barra", ["cuad"], ["gluteo", "core", "espalda_alta"], { est: true,
    tecnica: "Barra sobre los deltoides delanteros con los codos altos. El tronco va más vertical que en la trasera.",
    porque: "Pone más peso en el cuádriceps y castiga menos la zona lumbar.", alt: ["sentadilla", "sentadilla_hack"] }),
  E("sentadilla_hack", "Sentadilla hack / péndulo", "fuerza", "maquina", ["cuad"], ["gluteo"], { est: true,
    tecnica: "Espalda bien apoyada en el respaldo, baja hasta el fondo controlando la bajada.",
    porque: "Hipertrofia de cuádriceps con poca fatiga general y sin que el core sea lo que te limite.", alt: ["prensa", "sentadilla_frontal", "bulgara"] }),
  E("prensa", "Prensa de piernas", "fuerza", "maquina", ["cuad", "gluteo"], ["aductor"], {
    tecnica: "Pies a media altura en la plataforma, baja hasta donde la pelvis no se despegue del asiento.",
    porque: "Permite mucho volumen con poco riesgo técnico. Hace crecer más el vasto lateral (Burke et al.).", alt: ["sentadilla_hack", "sentadilla"] }),
  E("sentadilla_goblet", "Sentadilla goblet", "fuerza", "mancuernas", ["cuad", "gluteo"], ["core"], { est: true,
    tecnica: "Mancuerna o kettlebell pegada al pecho. Baja profundo y empuja las rodillas hacia fuera.",
    porque: "Sirve para casa y para calentar. También es muy buena para la movilidad de tobillo y cadera.", alt: ["sentadilla", "bulgara"] }),
  E("bulgara", "Sentadilla búlgara", "fuerza", "mancuernas", ["cuad", "gluteo"], ["aductor"], { est: true,
    tecnica: "Pie de atrás apoyado en un banco. Baja hasta que la rodilla de atrás casi toque el suelo. Echa el tronco algo adelante para cargar más el glúteo.",
    porque: "Trabajo unilateral: corrige diferencias entre piernas, estira mucho el glúteo y requiere poca carga.", alt: ["zancada_atras", "step_up", "pistol"] }),
  E("zancada_atras", "Zancada hacia atrás", "fuerza", "mancuernas", ["cuad", "gluteo"], ["aductor"], { est: true,
    tecnica: "Da un paso atrás y baja con control. Es más amable con la rodilla que la zancada hacia delante.",
    porque: "Unilateral, mejora el equilibrio y lo puedes hacer en casa.", alt: ["bulgara", "step_up"] }),
  E("step_up", "Subida al cajón (step-up)", "fuerza", "mancuernas", ["cuad", "gluteo"], [], {
    tecnica: "Cajón a la altura de la rodilla. Empuja con la pierna de arriba, no te impulses con la de abajo.",
    porque: "Muy útil para correr y para la vida diaria. Unilateral.", alt: ["bulgara", "zancada_atras"] }),
  E("extension_rodilla", "Extensión de rodilla (cuádriceps)", "fuerza", "maquina", ["cuad"], [], { est: true,
    tecnica: "Echa el respaldo hacia atrás si la máquina lo permite, así el recto femoral se estira más. Sube y baja controlado, con recorrido completo.",
    porque: "La única forma de cargar bien el recto femoral, que crece más con este ejercicio que con la prensa (Burke et al.).", alt: ["sissy_squat"] }),
  E("sissy_squat", "Sissy squat", "calistenia", "peso corporal", ["cuad"], [], { est: true,
    tecnica: "Agárrate a algo, lleva las rodillas hacia delante y echa el tronco atrás en línea recta.",
    porque: "Una alternativa sin máquina a la extensión de rodilla, con el cuádriceps muy estirado.", alt: ["extension_rodilla"] }),
  E("pistol", "Pistol squat (sentadilla a una pierna)", "calistenia", "peso corporal", ["cuad", "gluteo"], ["core"], { est: true,
    tecnica: "Empieza bajando a un banco o agarrado a algo. La otra pierna va estirada al frente.",
    porque: "Un reto de calistenia que combina fuerza, movilidad de tobillo y equilibrio.", alt: ["bulgara"] }),

  // ---------------- PIERNA: CADENA POSTERIOR ----------------
  E("rdl", "Peso muerto rumano (RDL)", "fuerza", "barra", ["isquio", "gluteo"], ["espalda_alta", "antebrazo", "lumbar"], { est: true,
    tecnica: "Rodillas un poco flexionadas, cadera atrás y barra pegada a las piernas. Baja hasta que notes tirar los isquios, con la espalda neutra.",
    porque: "Carga los isquios y el glúteo en posición estirada. Uno de los mejores ejercicios de cadena posterior.", alt: ["peso_muerto", "rdl_manc", "good_morning"] }),
  E("rdl_manc", "RDL con mancuernas / a una pierna", "fuerza", "mancuernas", ["isquio", "gluteo"], ["core"], { est: true,
    tecnica: "Igual que el RDL. La versión a una pierna además trabaja el equilibrio.",
    porque: "La versión de casa. Unilateral si lo necesitas.", alt: ["rdl"] }),
  E("good_morning", "Buenos días", "fuerza", "barra", ["isquio", "gluteo"], ["lumbar"], { est: true,
    tecnica: "Barra en la espalda, cadera atrás con la espalda neutra. Usa poca carga.",
    porque: "Una alternativa al RDL con mucho estiramiento de isquios.", alt: ["rdl"] }),
  E("peso_muerto", "Peso muerto convencional", "fuerza", "barra", ["gluteo", "isquio"], ["cuad", "espalda_alta", "antebrazo", "lumbar"], {
    tecnica: "Barra sobre la mitad del pie. Tensa la espalda antes de tirar y empuja el suelo con los pies.",
    porque: "Un clásico de fuerza total. Cansa mucho en general, así que puede sustituir al RDL en bloques de fuerza.", alt: ["rdl", "kb_swing"] }),
  E("curl_femoral_sentado", "Curl femoral sentado", "fuerza", "maquina", ["isquio"], [], { est: true,
    tecnica: "Inclina el tronco hacia delante para estirar más. Controla la bajada y sube con recorrido completo.",
    porque: "Dio más hipertrofia de isquios que el curl tumbado porque la cadera está flexionada y el músculo más estirado (Maeo 2021).", alt: ["curl_femoral_tumbado", "nordico"] }),
  E("curl_femoral_tumbado", "Curl femoral tumbado", "fuerza", "maquina", ["isquio"], ["gemelo"], {
    tecnica: "Pelvis pegada al banco y recorrido completo.", porque: "La alternativa si no tienes la máquina sentada.", alt: ["curl_femoral_sentado", "nordico"] }),
  E("nordico", "Curl nórdico", "prevencion", "peso corporal", ["isquio"], [], { est: true,
    tecnica: "De rodillas, con los tobillos sujetos. Déjate caer lo más lento posible y empuja con las manos para volver. Empieza con una banda de ayuda.",
    porque: "Se asocia a ~50 % menos lesiones de isquios (van Dyk 2019), aunque se discute. Es un estímulo excéntrico muy fuerte.", alt: ["curl_femoral_sentado"] }),
  E("hip_thrust", "Hip thrust", "fuerza", "barra", ["gluteo"], ["isquio", "cuad"], {
    tecnica: "Espalda apoyada en un banco y barra sobre la cadera. Sube hasta la extensión completa con la barbilla metida y aprieta arriba 1 s.",
    porque: "Hace crecer el glúteo igual que la sentadilla (Plotkin 2023), pero sin trabajar el cuádriceps. Sirve para añadir volumen de glúteo con poca fatiga.", alt: ["puente_gluteo", "kb_swing"] }),
  E("puente_gluteo", "Puente de glúteo a una pierna", "calistenia", "peso corporal", ["gluteo"], ["isquio"], {
    tecnica: "Tumbado o con la espalda en un banco, con un pie apoyado. Sube la cadera sin arquear la zona lumbar.",
    porque: "La versión de casa del hip thrust.", alt: ["hip_thrust"] }),
  E("kb_swing", "Swing con kettlebell", "plio", "kettlebell", ["gluteo", "isquio"], ["core", "antebrazo"], { med: "reps",
    tecnica: "Bisagra de cadera explosiva: la fuerza la pone la cadera, los brazos solo guían. La kettlebell sube a la altura del pecho.",
    porque: "Potencia de cadera y acondicionamiento a la vez.", alt: ["hip_thrust"] }),
  E("abduccion_cadera", "Abducción de cadera (máquina o banda)", "fuerza", "maquina", ["gluteo"], [], {
    tecnica: "Inclina el tronco algo adelante para trabajar más el glúteo medio y superior.", porque: "Glúteo medio: estabilidad de rodilla y cadera al correr.", alt: [] }),
  E("aductor_maquina", "Aductor en máquina", "fuerza", "maquina", ["aductor"], [], { est: true,
    tecnica: "Abre todo lo que puedas y controla la vuelta.", porque: "El aductor mayor es un músculo enorme que suele quedarse sin trabajar. Ayuda con la ingle.", alt: ["copenhagen", "cossack"] }),
  E("copenhagen", "Plancha Copenhagen", "prevencion", "peso corporal", ["aductor"], ["core"], { med: "seg",
    tecnica: "Plancha lateral con la pierna de arriba apoyada en un banco. Empieza apoyando la rodilla (versión corta).",
    porque: "Fortalece mucho los aductores. La evidencia de prevención de lesiones de ingle es débil.", alt: ["aductor_maquina"] }),
  E("gemelo_pie", "Elevación de gemelos de pie", "fuerza", "maquina", ["gemelo"], [], { est: true,
    tecnica: "Rodilla estirada, pausa de 1–2 s abajo del todo y sube completo. Puedes terminar con parciales en la parte baja.",
    porque: "El gemelo crece más con el trabajo en estiramiento y con parciales abajo (estudio 2024). Ayuda a la carrera y al tendón de Aquiles.", alt: ["gemelo_escalon", "gemelo_sentado"] }),
  E("gemelo_escalon", "Gemelo a una pierna en escalón", "calistenia", "peso corporal", ["gemelo"], [], { est: true,
    tecnica: "Talón por debajo del escalón y pausa abajo. Coge una mancuerna cuando te resulte fácil.", porque: "Versión de casa.", alt: ["gemelo_pie"] }),
  E("gemelo_sentado", "Gemelo sentado (sóleo)", "fuerza", "maquina", ["gemelo"], [], {
    tecnica: "Rodilla doblada a 90° y recorrido completo.", porque: "El sóleo aguanta la mayor parte de la carga al correr.", alt: ["gemelo_pie"] }),
  E("tibial", "Elevación de tibial", "prevencion", "peso corporal", ["tibial"], [], {
    tecnica: "Espalda apoyada en la pared y talones adelantados. Levanta las puntas de los pies (con banda o con una tibialis bar).",
    porque: "Equilibra la pierna y protege de molestias en la tibia al correr. Evidencia sobre todo práctica.", alt: [] }),

  // ---------------- EMPUJE ----------------
  E("press_banca", "Press banca con barra", "fuerza", "barra", ["pecho"], ["triceps", "delt_ant"], {
    tecnica: "Escápulas atrás y abajo con un ligero arco. La barra toca la parte baja del pecho, con los codos a unos 45–70°.",
    porque: "El básico de empuje. Hace crecer el pecho igual que las aperturas, y además da fuerza máxima y trabaja el deltoides anterior y el tríceps. Por eso el plan no tiene elevaciones frontales.", alt: ["press_manc_plano", "flexiones", "press_inclinado_manc"] }),
  E("press_manc_plano", "Press con mancuernas plano", "fuerza", "mancuernas", ["pecho"], ["triceps", "delt_ant"], { est: true,
    tecnica: "Baja hasta notar el pecho estirado, más abajo que con barra.", porque: "Tiene más recorrido (más estiramiento) que la barra.", alt: ["press_banca"] }),
  E("press_inclinado_manc", "Press inclinado con mancuernas", "fuerza", "mancuernas", ["pecho", "delt_ant"], ["triceps"], { est: true,
    tecnica: "Banco a 30°, baja hasta un estiramiento profundo y controlado.", porque: "Trabaja más la parte superior del pecho, con mucho recorrido.", alt: ["press_banca", "flexiones_deficit"] }),
  E("aperturas_polea", "Cruce de poleas / aperturas", "fuerza", "polea", ["pecho"], ["delt_ant"], { est: true,
    tecnica: "Codos un poco flexionados. Abre hasta notar el estiramiento y cierra apretando.",
    porque: "Hace crecer el pecho igual que el press (Schoenfeld, 10 semanas: +15 % frente a +13 %, sin diferencia real). Cansa menos el hombro y el tríceps y estira el pecho, útil con hombros adelantados.", alt: ["press_manc_plano", "fondos"] }),
  E("fondos", "Fondos en paralelas", "calistenia", "peso corporal", ["pecho", "triceps"], ["delt_ant"], { est: true,
    tecnica: "Inclina el tronco un poco adelante y baja hasta que el hombro quede algo por debajo del codo, si no molesta. Añade lastre cuando hagas más de 12.",
    porque: "Calistenia de empuje muy completa, con estiramiento profundo del pecho. Ojo con los hombros adelantados: la parte baja carga la cápsula anterior del hombro. Por eso en tu plan van las aperturas en su lugar.", alt: ["flexiones_deficit", "press_banca", "aperturas_polea"] }),
  E("flexiones", "Flexiones", "calistenia", "peso corporal", ["pecho"], ["triceps", "delt_ant", "core"], {
    tecnica: "Cuerpo en bloque y pecho hasta casi tocar el suelo. Para progresar: lastre, pies elevados o una sola mano.", porque: "Básico de casa, siempre disponible.", alt: ["flexiones_deficit", "press_banca"] }),
  E("flexiones_deficit", "Flexiones en déficit (manos elevadas)", "calistenia", "peso corporal", ["pecho"], ["triceps", "delt_ant"], { est: true,
    tecnica: "Manos sobre discos o paralelas bajas para que el pecho baje más que las manos.", porque: "Más estiramiento de pecho que en la flexión normal.", alt: ["flexiones", "fondos"] }),
  E("press_militar", "Press militar de pie", "fuerza", "barra", ["delt_ant"], ["triceps", "delt_lat", "core"], {
    tecnica: "Glúteo y abdomen apretados. La barra sube en línea recta y la cabeza pasa por debajo, hacia delante.", porque: "Fuerza de hombro por encima de la cabeza y estabilidad de todo el cuerpo.", alt: ["press_hombro_manc", "pike_pushup"] }),
  E("press_hombro_manc", "Press de hombro con mancuernas sentado", "fuerza", "mancuernas", ["delt_ant"], ["triceps", "delt_lat"], {
    tecnica: "Respaldo casi vertical. Baja hasta la altura de las orejas.", porque: "Más estable que el militar y fácil de progresar.", alt: ["press_militar"] }),
  E("pike_pushup", "Flexión pike → flexión en pino", "calistenia", "peso corporal", ["delt_ant", "triceps"], ["espalda_alta"], {
    tecnica: "Cadera alta y la cabeza baja entre las manos. Progresión: pies elevados y después pino contra la pared.", porque: "La progresión de calistenia hasta la flexión en pino.", alt: ["press_militar"] }),
  E("pino_pared", "Pino contra la pared (aguante)", "calistenia", "peso corporal", ["delt_ant"], ["core", "espalda_alta"], { med: "seg",
    tecnica: "Mirando a la pared, cuerpo recto y hombros empujando hacia arriba.", porque: "Técnica de pino, salud del hombro por encima de la cabeza y control corporal.", alt: [] }),
  E("elev_lateral_manc", "Elevaciones laterales con mancuernas", "fuerza", "mancuernas", ["delt_lat"], [], {
    tecnica: "Inclínate un poco hacia delante y sube hasta la altura de los hombros. Sin balanceo: aquí el peso importa poco.", porque: "El deltoides lateral es lo que da anchura al hombro y casi no trabaja en los presses.", alt: ["elev_lateral_polea"] }),
  E("elev_lateral_polea", "Elevación lateral en polea", "fuerza", "polea", ["delt_lat"], [], { est: true,
    tecnica: "Polea baja que pasa por detrás o por delante del cuerpo. Empieza con el brazo cruzado (estirado).", porque: "Mantiene la tensión en la parte baja, donde la mancuerna no trabaja.", alt: ["elev_lateral_manc"] }),

  // ---------------- TRÍCEPS ----------------
  E("ext_triceps_sobre_cabeza", "Extensión de tríceps sobre la cabeza", "fuerza", "polea", ["triceps"], [], { est: true,
    tecnica: "En polea o con mancuerna. Codos arriba y baja hasta un estiramiento profundo detrás de la cabeza.",
    porque: "Hizo crecer el tríceps ~40 % más que el press hacia abajo (Maeo 2022), porque la cabeza larga trabaja estirada.", alt: ["press_frances", "pushdown"] }),
  E("press_frances", "Press francés", "fuerza", "barra", ["triceps"], [], { est: true,
    tecnica: "Barra Z hacia la frente o por detrás de la cabeza, con los codos quietos.", porque: "Tríceps estirado, una buena alternativa.", alt: ["ext_triceps_sobre_cabeza"] }),
  E("pushdown", "Extensión de tríceps en polea alta", "fuerza", "polea", ["triceps"], [], {
    tecnica: "Codos pegados al cuerpo y extensión completa.", porque: "Fácil de recuperar y bueno para acumular volumen.", alt: ["ext_triceps_sobre_cabeza"] }),

  // ---------------- TIRÓN ----------------
  E("dominadas", "Dominadas", "calistenia", "peso corporal", ["dorsal"], ["biceps", "espalda_alta", "antebrazo"], { est: true,
    tecnica: "Empieza colgado con los brazos estirados del todo y sube hasta que la barbilla pase la barra. Añade lastre cuando hagas más de 10. Si no llegas a 5: excéntricas o banda.",
    porque: "El tirón vertical por excelencia, con el dorsal muy estirado al principio.", alt: ["jalon", "remo_invertido"] }),
  E("jalon", "Jalón al pecho", "fuerza", "polea", ["dorsal"], ["biceps", "espalda_alta"], { est: true,
    tecnica: "Agarre neutro o prono, tronco algo inclinado hacia atrás. Lleva los codos hacia los bolsillos.", porque: "Te deja ajustar la carga exacta.", alt: ["dominadas"] }),
  E("remo_barra", "Remo con barra", "fuerza", "barra", ["dorsal", "espalda_alta"], ["biceps", "delt_post", "isquio"], {
    tecnica: "Tronco a ~45° con la espalda neutra. La barra va hacia el ombligo.", porque: "Remo pesado, aunque cansa la zona lumbar.", alt: ["remo_pecho_apoyado", "remo_manc_1brazo"] }),
  E("remo_pecho_apoyado", "Remo con pecho apoyado", "fuerza", "mancuernas", ["espalda_alta", "dorsal"], ["delt_post", "biceps"], { est: true,
    tecnica: "Pecho en un banco inclinado o en máquina. Deja que las escápulas se abran abajo y júntalas arriba.", porque: "Toda la espalda alta sin cansar la zona lumbar.", alt: ["remo_barra", "remo_polea"] }),
  E("remo_manc_1brazo", "Remo con mancuerna a un brazo", "fuerza", "mancuernas", ["dorsal"], ["espalda_alta", "biceps"], { est: true,
    tecnica: "Apoya una mano en el banco y lleva el codo hacia la cadera. Abajo deja que el dorsal se estire del todo.", porque: "Dorsal con mucho recorrido, unilateral.", alt: ["remo_polea", "remo_pecho_apoyado"] }),
  E("remo_polea", "Remo en polea sentado", "fuerza", "polea", ["dorsal", "espalda_alta"], ["biceps", "delt_post"], { est: true,
    tecnica: "Inclínate un poco hacia delante para estirar y tira llevando el pecho hacia delante.", porque: "Tensión constante y fácil de progresar.", alt: ["remo_manc_1brazo"] }),
  E("remo_invertido", "Remo invertido (australiano)", "calistenia", "peso corporal", ["espalda_alta", "dorsal"], ["biceps", "delt_post", "core"], {
    tecnica: "Barra baja o anillas, cuerpo recto. Lleva el pecho a la barra. Para progresar: pies elevados.", porque: "El remo de calistenia. Te prepara para las dominadas.", alt: ["remo_pecho_apoyado"] }),
  E("pullover_polea", "Pullover en polea", "fuerza", "polea", ["dorsal"], ["triceps"], { est: true,
    tecnica: "Brazos casi estirados y baja la barra desde arriba hasta los muslos.", porque: "Dorsal aislado y estirado, sin que el bíceps te limite.", alt: ["jalon"] }),
  E("face_pull", "Face pull", "fuerza", "polea", ["delt_post", "espalda_alta"], [], {
    tecnica: "Cuerda a la altura de la cara. Abre separando las manos y rota hacia fuera.", porque: "Deltoides posterior y salud del hombro, para equilibrar todo el empuje.", alt: ["pajaro"] }),
  E("pajaro", "Pájaro / reverse fly", "fuerza", "mancuernas", ["delt_post"], ["espalda_alta"], {
    tecnica: "Tronco inclinado o en máquina pec-deck inversa. Abre los brazos, sin remar.", porque: "Aislamiento del deltoides posterior.", alt: ["face_pull"] }),
  E("encogimientos", "Encogimientos de trapecio", "fuerza", "mancuernas", ["espalda_alta"], ["antebrazo"], {
    tecnica: "Hombros hacia las orejas, pausa arriba.", porque: "Trapecio superior. Opcional.", alt: ["paseo_granjero"] }),

  // ---------------- POSTURA (cifosis: escápulas, hombros, lumbares) ----------------
  E("y_raise", "Elevación en Y (trapecio inferior)", "fuerza", "mancuernas", ["espalda_alta"], ["delt_post", "delt_lat"], {
    tecnica: "Tumbado boca abajo en un banco inclinado a 30–45°, con los pulgares hacia arriba. Primero lleva las escápulas atrás y abajo, después sube los brazos en Y hasta la altura de las orejas. Peso muy ligero (1–5 kg) y 1 s arriba.",
    porque: "Es el ejercicio que más activa el trapecio inferior (Ekstrom 2003), sobre todo si piensas en bajar y echar atrás las escápulas. Ese músculo suele estar débil cuando hay cifosis.", alt: ["wall_slide", "face_pull"] }),
  E("band_pull_apart", "Aperturas con banda (band pull-apart)", "prevencion", "banda", ["delt_post", "espalda_alta"], [], {
    tecnica: "Brazos estirados al frente a la altura de los hombros. Abre la banda hasta tocar el pecho juntando las escápulas, sin subir los hombros.",
    porque: "Activa el deltoides posterior y los romboides con poco esfuerzo. Sirve de calentamiento en los días de torso y como descanso activo si pasas el día sentado.", alt: ["face_pull", "pajaro"] }),
  E("rotacion_externa", "Rotación externa en polea", "prevencion", "polea", ["delt_post"], [], {
    tecnica: "Codo pegado al cuerpo a 90° (pon una toalla entre el codo y el costado). Gira el antebrazo hacia fuera, despacio y con poco peso.",
    porque: "Fortalece el manguito de los rotadores (infraespinoso), que estabiliza el hombro y lo ayuda a mantenerse atrás.", alt: ["face_pull"] }),
  E("wall_slide", "Deslizamientos en pared (wall slides)", "prevencion", "peso corporal", ["espalda_alta"], ["delt_lat"], {
    tecnica: "Espalda, cabeza y antebrazos contra la pared. Desliza los brazos hacia arriba sin despegar la zona lumbar ni las muñecas. Si te cuesta, separa los pies un poco de la pared.",
    porque: "Entrena el control de las escápulas en la postura contraria a la de estar sentado. Combina movilidad torácica y trapecio inferior.", alt: ["y_raise"] }),
  E("hiperextension", "Extensión lumbar en banco a 45°", "fuerza", "maquina", ["lumbar", "gluteo"], ["isquio"], {
    tecnica: "Cadera apoyada al borde del banco. Baja con la espalda neutra y sube hasta dejar el cuerpo en línea recta, sin arquear de más. Para progresar: coge un disco contra el pecho.",
    porque: "Fortalece los erectores de la columna, los glúteos y los isquios, tres de tus zonas débiles, sin cargar la columna como un peso muerto.", alt: ["good_morning", "bird_dog"] }),
  E("bird_dog", "Bird dog", "prevencion", "peso corporal", ["core"], ["lumbar", "gluteo"], {
    tecnica: "A cuatro patas, estira el brazo y la pierna contrarios sin mover la pelvis ni la espalda (imagina un vaso de agua sobre la zona lumbar). Aguanta 5–8 s.",
    porque: "Del 'big 3' de McGill: estabilidad lumbar con muy poca carga en la columna.", alt: ["dead_bug"] }),
  E("ext_toracica", "Extensión torácica en foam roller", "movilidad", "otro", [], [], { med: "check",
    tecnica: "Rodillo bajo la parte alta de la espalda y manos detrás de la cabeza. Extiéndete por encima del rodillo sin arquear la zona lumbar. Muévelo un poco para trabajar varios puntos. 1–2 min.",
    porque: "Recupera la extensión de la espalda alta que se pierde de tanto estar sentado.", alt: ["open_book"] }),
  E("chin_tuck", "Retracción cervical (chin tuck)", "movilidad", "ninguno", [], [], { med: "check",
    tecnica: "Mete la barbilla hacia atrás, como haciendo papada, sin bajar la cabeza. Aguanta 3–5 s. 10 repeticiones, de pie o tumbado.",
    porque: "Corrige la cabeza adelantada que suele acompañar a la cifosis, porque activa los flexores profundos del cuello.", alt: [] }),
  E("cat_camel", "Gato-camello", "movilidad", "ninguno", [], [], { med: "check",
    tecnica: "A cuatro patas, alterna despacio entre redondear la espalda y extenderla. 8–10 veces.",
    porque: "Movilidad suave de toda la columna. Ideal al levantarte o después de muchas horas sentado.", alt: [] }),

  // ---------------- BÍCEPS / ANTEBRAZO ----------------
  E("curl_inclinado", "Curl inclinado con mancuernas", "fuerza", "mancuernas", ["biceps"], [], { est: true,
    tecnica: "Banco a 45–60° con los brazos colgando por detrás del cuerpo. Sube sin adelantar los codos.", porque: "Bíceps estirado (hombro en extensión).", alt: ["curl_bayesian", "curl_barra"] }),
  E("curl_bayesian", "Curl bayesiano en polea", "fuerza", "polea", ["biceps"], [], { est: true,
    tecnica: "De espaldas a la polea baja, con el brazo por detrás del cuerpo.", porque: "Lo mismo que el curl inclinado, con tensión constante.", alt: ["curl_inclinado"] }),
  E("curl_barra", "Curl con barra", "fuerza", "barra", ["biceps"], ["antebrazo"], {
    tecnica: "Codos quietos, sin balanceo.", porque: "Permite mucha carga y se progresa fácil.", alt: ["curl_inclinado"] }),
  E("curl_martillo", "Curl martillo", "fuerza", "mancuernas", ["biceps", "antebrazo"], [], {
    tecnica: "Agarre neutro.", porque: "Braquial y braquiorradial: grosor del brazo y fuerza de agarre.", alt: ["curl_barra"] }),
  E("paseo_granjero", "Paseo del granjero", "fuerza", "mancuernas", ["antebrazo", "core"], ["espalda_alta", "gemelo"], { med: "seg",
    tecnica: "Peso pesado en cada mano, camina erguido con pasos cortos.", porque: "El agarre se asocia a longevidad. Trabaja el core y la estabilidad.", alt: ["colgarse"] }),
  E("colgarse", "Colgarse de la barra (dead hang)", "movilidad", "peso corporal", ["antebrazo"], ["dorsal"], { med: "seg",
    tecnica: "Cuélgate relajado o activo (escápulas abajo).", porque: "Agarre, descompresión y movilidad de hombro.", alt: ["paseo_granjero"] }),

  // ---------------- CORE ----------------
  E("rueda_abdominal", "Rueda abdominal", "fuerza", "otro", ["core"], ["dorsal"], { est: true,
    tecnica: "De rodillas, rueda hacia delante sin arquear la espalda (pelvis hacia dentro).", porque: "Antiextensión con el abdomen estirado. Muy eficaz.", alt: ["plancha", "dead_bug"] }),
  E("plancha", "Plancha frontal", "fuerza", "peso corporal", ["core"], [], { med: "seg",
    tecnica: "Codos bajo los hombros, glúteo apretado y pelvis hacia dentro. Mejor 20–40 s de máxima tensión que 3 min flojos.", porque: "Base de antiextensión.", alt: ["rueda_abdominal", "dead_bug"] }),
  E("plancha_lateral", "Plancha lateral", "fuerza", "peso corporal", ["core"], ["gluteo"], { med: "seg",
    tecnica: "Cuerpo recto, cadera alta.", porque: "Oblicuos y cuadrado lumbar. Buena para la espalda (McGill).", alt: ["copenhagen"] }),
  E("dead_bug", "Dead bug", "fuerza", "peso corporal", ["core"], [], {
    tecnica: "Zona lumbar pegada al suelo. Estira el brazo y la pierna contrarios despacio.", porque: "Control del core. Ideal en la vuelta al entrenamiento.", alt: ["plancha"] }),
  E("pallof", "Press Pallof", "fuerza", "polea", ["core"], [], {
    tecnica: "De lado a la polea o a la banda, empuja al frente sin dejar que el cuerpo rote.", porque: "Antirrotación, muy útil para correr y en el deporte.", alt: ["plancha_lateral"] }),
  E("elev_piernas_colgado", "Elevación de piernas colgado", "calistenia", "peso corporal", ["core"], ["antebrazo"], {
    tecnica: "Retroversión de pelvis al subir, sin balanceo. Progresión: rodillas → piernas estiradas → toes to bar.", porque: "Flexión de cadera y abdomen. Te prepara para el L-sit.", alt: ["dead_bug"] }),
  E("hollow", "Hollow hold", "calistenia", "peso corporal", ["core"], [], { med: "seg",
    tecnica: "Tumbado boca arriba con la zona lumbar pegada al suelo. Brazos y piernas estirados un poco elevados.", porque: "La base de la calistenia (posición hueca).", alt: ["dead_bug"] }),
  E("l_sit", "L-sit", "calistenia", "peso corporal", ["core"], ["triceps", "cuad"], { med: "seg",
    tecnica: "En paralelas o en el suelo. Progresión: con rodillas dobladas → a una pierna → completo.", porque: "Habilidad de calistenia: compresión, fuerza y flexibilidad de isquios.", alt: ["elev_piernas_colgado"] }),
  E("muscle_up", "Muscle-up (objetivo avanzado)", "calistenia", "peso corporal", ["dorsal", "triceps"], ["pecho", "biceps"], {
    tecnica: "Necesitas antes unas 10 dominadas estrictas y 15 fondos. Dominada explosiva hasta el pecho y transición.", porque: "Un objetivo de habilidad: fuerza explosiva de tirón.", alt: ["dominadas"] }),

  // ---------------- PLIOMETRÍA / AGILIDAD / POTENCIA ----------------
  E("salto_cajon", "Salto al cajón", "plio", "otro", ["cuad", "gluteo"], ["gemelo"], {
    tecnica: "Salto máximo y aterrizaje suave. Baja andando, nunca saltando. Descansa del todo entre saltos.", porque: "Potencia con poco impacto al aterrizar.", alt: ["salto_vertical"] }),
  E("salto_vertical", "Salto con contramovimiento", "plio", "peso corporal", ["cuad", "gluteo"], ["gemelo"], {
    tecnica: "Bajada rápida y salto máximo. Cada salto es independiente.", porque: "Potencia del tren inferior.", alt: ["salto_cajon"] }),
  E("salto_horizontal", "Salto horizontal (longitud)", "plio", "peso corporal", ["gluteo", "isquio"], ["cuad"], {
    tecnica: "Usa los brazos y aterriza estable. Puedes medir la distancia como test.", porque: "Potencia horizontal: sprint y cambio de dirección.", alt: ["multisaltos"] }),
  E("multisaltos", "Multisaltos (bounds)", "plio", "peso corporal", ["gluteo", "cuad"], ["gemelo"], {
    tecnica: "Zancadas saltadas exageradas, 3–5 seguidas.", porque: "Rigidez reactiva y economía de carrera.", alt: ["salto_horizontal"] }),
  E("skater", "Saltos laterales (skater)", "plio", "peso corporal", ["gluteo"], ["aductor", "cuad"], {
    tecnica: "Salta de lado de una pierna a la otra y aguanta el aterrizaje 1 s.", porque: "Potencia lateral y estabilidad de rodilla: agilidad.", alt: [] }),
  E("pogo", "Pogo jumps (saltitos de tobillo)", "plio", "peso corporal", ["gemelo"], [], {
    tecnica: "Rodillas casi estiradas, contacto con el suelo muy corto, como un muelle.", porque: "Rigidez del tendón de Aquiles y economía de carrera.", alt: ["comba"] }),
  E("comba", "Comba", "plio", "otro", ["gemelo"], [], { med: "seg",
    tecnica: "Saltos bajos y rápidos sobre la parte delantera del pie.", porque: "Coordinación, tobillos y cardio.", alt: ["pogo"] }),
  E("agilidad_conos", "Agilidad: 5-10-5 / conos", "plio", "otro", ["cuad", "gluteo"], ["aductor"], { med: "seg",
    tecnica: "Sprint corto con cambio de dirección: baja el centro de gravedad al frenar. Cronométralo.", porque: "Cambio de dirección específico. Mejora con pliometría y práctica.", alt: ["skater"] }),
  E("sprint_cuesta", "Sprints en cuesta", "plio", "ninguno", ["gluteo", "isquio"], ["cuad", "gemelo"], { med: "seg",
    tecnica: "8–10 s al ~95 % en cuesta y vuelta andando. La cuesta reduce el riesgo para los isquios.", porque: "Velocidad y potencia con un riesgo de lesión bajo.", alt: [] }),
  E("lanz_balon", "Lanzamiento de balón medicinal", "plio", "otro", ["pecho", "core"], ["triceps"], {
    tecnica: "Lanzamiento al pecho contra la pared o lanzamiento rotacional de lado.", porque: "Potencia del tren superior y rotacional.", alt: [] }),

  // ---------------- CARDIO ----------------
  E("rodaje_suave", "Rodaje suave (zona 1–2)", "cardio", "ninguno", [], [], { med: "cardio",
    tecnica: "Un ritmo al que puedas mantener una conversación, ~60–75 % de la FC máx. Si te ahogas, anda un rato.", porque: "Es el 80 % del volumen de cardio: base aeróbica sin fatiga.", alt: ["bici_suave", "eliptica", "remo_ergo", "natacion"] }),
  E("tirada_larga", "Tirada larga suave", "cardio", "ninguno", [], [], { med: "cardio",
    tecnica: "Igual que el rodaje suave pero más larga. No debe superar en más de un 10 % tu salida más larga del último mes.", porque: "La adaptación aeróbica crece con el volumen. Vigila los picos de distancia (Nielsen 2025).", alt: ["bici_suave"] }),
  E("intervalos_4x4", "Intervalos noruegos 4×4", "cardio", "ninguno", [], [], { med: "cardio",
    tecnica: "10 min suaves → 4 × (4 min al 85–95 % de la FC máx, «difícil pero sostenible») con 3 min suaves → 5 min de vuelta a la calma. Corriendo en cuesta, bici o remo.",
    porque: "El protocolo con más evidencia para subir el VO2max (Helgerud 2007). El VO2max es un gran predictor de longevidad.", alt: ["sit"] }),
  E("sit", "Sprint interval (6×30 s)", "cardio", "ninguno", [], [], { med: "cardio",
    tecnica: "6 × 30 s a tope con 2–4 min suaves entre medias. Mejor en bici estática.", porque: "Sube el VO2max con muy poco tiempo. Una alternativa al 4×4.", alt: ["intervalos_4x4"] }),
  E("tempo", "Tempo / umbral", "cardio", "ninguno", [], [], { med: "cardio",
    tecnica: "20–30 min a un ritmo «cómodamente duro», ~80–88 % de la FC máx.", porque: "Opcional en el bloque de rendimiento para 10K o media maratón.", alt: [] }),
  E("bici_suave", "Bici estática suave", "cardio", "maquina", [], [], { med: "cardio", tecnica: "Zona 2, cadencia 80–95.", porque: "Cardio sin impacto: buena para la vuelta y en días de pierna.", alt: ["rodaje_suave"] }),
  E("remo_ergo", "Remoergómetro", "cardio", "maquina", [], [], { med: "cardio", tecnica: "Orden: piernas → tronco → brazos.", porque: "Cardio de cuerpo entero.", alt: ["rodaje_suave"] }),
  E("eliptica", "Elíptica", "cardio", "maquina", [], [], { med: "cardio", tecnica: "Zona 2.", porque: "Sin impacto.", alt: ["rodaje_suave"] }),
  E("natacion", "Natación", "cardio", "otro", [], [], { med: "cardio", tecnica: "Suave y continuo, o series.", porque: "Sin impacto. Cuerpo entero.", alt: ["rodaje_suave"] }),
  E("caminar_inclinado", "Caminar en cinta inclinada / con mochila", "cardio", "maquina", [], [], { med: "cardio", tecnica: "Pendiente del 8–15 %.", porque: "Zona 2 con muy poco impacto.", alt: ["rodaje_suave"] }),

  // ---------------- MOVILIDAD / CALENTAMIENTO ----------------
  E("calentamiento_ramp", "Calentamiento RAMP (8–10 min)", "movilidad", "ninguno", [], [], { med: "check",
    tecnica: "1) 3 min de cardio suave · 2) movilidad dinámica: world's greatest stretch, 90/90, gato-camello, balanceos de pierna · 3) activación: puente, dead bug · 4) series de aproximación del primer ejercicio (50 %×8, 70 %×4, 85 %×2).",
    porque: "Un calentamiento dinámico mejora el rendimiento y ayuda a prevenir lesiones (FIFA 11+).", alt: [] }),
  E("worlds_greatest", "World's greatest stretch", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Zancada, codo al empeine y rotación abriendo el brazo al techo.", porque: "Movilidad global de cadera y espalda.", alt: [] }),
  E("cadera_9090", "Cadera 90/90", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Sentado con las dos rodillas a 90°, cambia de lado sin usar las manos.", porque: "Rotación interna y externa de cadera.", alt: [] }),
  E("couch_stretch", "Couch stretch (flexor de cadera)", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Rodilla apoyada contra la pared y glúteo apretado. 1–2 min por lado.", porque: "Flexores de cadera y cuádriceps, que se acortan mucho si pasas el día sentado.", alt: [] }),
  E("estir_isquios", "Estiramiento de isquios", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Pierna estirada en alto, con la espalda neutra. 1–2 min.", porque: "Flexibilidad posterior. Hacen falta ≥5–10 min/semana por zona para que funcione (Ingram 2024).", alt: [] }),
  E("pigeon", "Postura de la paloma (glúteo)", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Pierna de delante cruzada, tronco adelante. 1–2 min por lado.", porque: "Rotadores externos y glúteo.", alt: [] }),
  E("cossack", "Sentadilla cosaca", "movilidad", "peso corporal", ["aductor"], ["cuad"], { tecnica: "Sentadilla lateral profunda con la otra pierna estirada.", porque: "Movilidad activa de aductores.", alt: [] }),
  E("sentadilla_profunda", "Aguante en sentadilla profunda", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Abajo del todo, talones en el suelo. Acumula 2–5 min.", porque: "Movilidad de tobillo y cadera.", alt: [] }),
  E("estir_pecho", "Estiramiento de pecho en la puerta", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Antebrazo en el marco de la puerta y gira el cuerpo hacia fuera.", porque: "Postura y hombro.", alt: [] }),
  E("open_book", "Open book (rotación torácica)", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Tumbado de lado, abre el brazo de arriba siguiéndolo con la mirada.", porque: "Movilidad de la espalda alta.", alt: [] }),
  E("estir_gemelo", "Estiramiento de gemelo y sóleo", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Contra la pared, primero con la rodilla estirada y después flexionada.", porque: "Dorsiflexión de tobillo para la sentadilla y la carrera.", alt: [] }),
  E("cars", "CARs (rotaciones articulares controladas)", "movilidad", "ninguno", [], [], { med: "check", tecnica: "Círculos lentos y máximos con hombro, cadera, columna y tobillo.", porque: "Rutina diaria de mantenimiento de 5 min.", alt: [] }),
  E("bloque_movilidad", "Bloque de estiramientos (10–15 min)", "movilidad", "ninguno", [], [], { med: "check",
    tecnica: "Elige 4–5 zonas rígidas, 2–3 min cada una: couch stretch, isquios, paloma, pecho, open book, gemelo.",
    porque: "La flexibilidad depende del tiempo semanal acumulado por zona (≥5–10 min/semana).", alt: [] }),
];

const EJ = Object.fromEntries(EJERCICIOS.map((e) => [e.id, e]));

// =====================================================================
// PLANES
// item: { ej, series, reps:[min,max], rir, desc (segundos), nota }
// Para med 'seg' las "reps" son segundos. Para 'cardio' se usa 'presc'.
// =====================================================================

const PLANES = {
  P6: {
    nombre: "Plan completo · 6 días (4 fuerza + 2 cardio)",
    sesiones: [
      { id: "INF_A", dia: "Lunes", nombre: "Pierna A · fuerza + potencia", items: [
        { ej: "calentamiento_ramp" },
        { ej: "salto_cajon", series: 4, reps: [3, 3], rir: 3, desc: 60, nota: "Frescos, saltos de calidad" },
        { ej: "sentadilla", series: 4, reps: [4, 6], rir: 2, desc: 180 },
        { ej: "rdl", series: 3, reps: [6, 8], rir: 2, desc: 150 },
        { ej: "bulgara", series: 3, reps: [8, 12], rir: 1, desc: 90, nota: "Reps por pierna" },
        { ej: "curl_femoral_sentado", series: 3, reps: [10, 15], rir: 1, desc: 90 },
        { ej: "gemelo_pie", series: 3, reps: [8, 12], rir: 1, desc: 60, nota: "Pausa abajo de 2 s" },
        { ej: "copenhagen", series: 2, reps: [20, 30], rir: 2, desc: 45, nota: "Segundos por lado" },
      ]},
      // Torso: los tirones van primero (prioridad por la cifosis) y hay ~1,5 series de tirón por cada una de empuje
      { id: "SUP_A", dia: "Martes", nombre: "Torso A · fuerza", items: [
        { ej: "calentamiento_ramp" },
        { ej: "ext_toracica", nota: "1–2 min antes de empezar" },
        { ej: "band_pull_apart", series: 2, reps: [15, 20], rir: 3, desc: 30, nota: "Activación" },
        { ej: "dominadas", series: 4, reps: [4, 8], rir: 2, desc: 150, nota: "Lastre cuando hagas más de 8" },
        { ej: "press_banca", series: 4, reps: [4, 6], rir: 2, desc: 180 },
        { ej: "remo_pecho_apoyado", series: 3, reps: [8, 12], rir: 1, desc: 120 },
        { ej: "press_militar", series: 3, reps: [6, 8], rir: 2, desc: 150 },
        { ej: "y_raise", series: 3, reps: [10, 15], rir: 1, desc: 60, nota: "Peso ligero, escápulas abajo" },
        { ej: "elev_lateral_polea", series: 3, reps: [12, 20], rir: 0, desc: 60 },
        { ej: "ext_triceps_sobre_cabeza", series: 3, reps: [10, 15], rir: 1, desc: 75 },
        { ej: "curl_inclinado", series: 2, reps: [10, 15], rir: 1, desc: 75 },
        { ej: "bici_suave", presc: "Opcional: 20 min suaves en zona 2" },
      ]},
      { id: "CAR_INT", dia: "Miércoles", nombre: "Cardio · intervalos 4×4 + movilidad", items: [
        { ej: "intervalos_4x4", presc: "10' suave + 4×4' al 85–95 % FC máx (3' suaves entre medias) + 5' suave",
          notaReentrada: "Semanas 1–2: en vez de esto, 30' suaves + 6 progresivos de 20 s" },
        { ej: "bloque_movilidad" },
      ]},
      { id: "INF_B", dia: "Jueves", nombre: "Pierna B · hipertrofia + agilidad", items: [
        { ej: "calentamiento_ramp" },
        { ej: "skater", series: 3, reps: [5, 5], rir: 3, desc: 60, nota: "Reps por lado" },
        { ej: "pogo", series: 2, reps: [15, 20], rir: 3, desc: 60 },
        { ej: "hip_thrust", series: 3, reps: [8, 12], rir: 1, desc: 120 },
        { ej: "nordico", series: 3, reps: [4, 8], rir: 2, desc: 120, nota: "Fase excéntrica lenta; con banda si hace falta" },
        { ej: "sentadilla_hack", series: 3, reps: [8, 12], rir: 1, desc: 120 },
        { ej: "hiperextension", series: 3, reps: [10, 15], rir: 2, desc: 90, nota: "Espalda neutra; disco al pecho cuando sea fácil" },
        { ej: "extension_rodilla", series: 2, reps: [12, 20], rir: 0, desc: 75 },
        { ej: "abduccion_cadera", series: 2, reps: [12, 20], rir: 1, desc: 60 },
        { ej: "aductor_maquina", series: 2, reps: [12, 15], rir: 1, desc: 75 },
        { ej: "gemelo_sentado", series: 3, reps: [12, 20], rir: 1, desc: 60 },
        { ej: "tibial", series: 2, reps: [15, 25], rir: 2, desc: 45 },
      ]},
      { id: "SUP_B", dia: "Viernes", nombre: "Torso B · hipertrofia", items: [
        { ej: "calentamiento_ramp" },
        { ej: "wall_slide", series: 2, reps: [8, 12], rir: 3, desc: 30, nota: "Activación" },
        { ej: "remo_manc_1brazo", series: 3, reps: [8, 12], rir: 1, desc: 90 },
        { ej: "press_inclinado_manc", series: 3, reps: [8, 12], rir: 1, desc: 120 },
        { ej: "jalon", series: 3, reps: [10, 15], rir: 1, desc: 90 },
        { ej: "aperturas_polea", series: 3, reps: [10, 15], rir: 1, desc: 75, nota: "Abre hasta notar el pecho estirado, sin adelantar los hombros" },
        { ej: "face_pull", series: 3, reps: [12, 20], rir: 1, desc: 60 },
        { ej: "elev_lateral_manc", series: 3, reps: [12, 20], rir: 0, desc: 60 },
        { ej: "rotacion_externa", series: 2, reps: [12, 15], rir: 2, desc: 45, nota: "Por brazo, poco peso" },
        { ej: "curl_martillo", series: 2, reps: [10, 15], rir: 1, desc: 60 },
        { ej: "press_frances", series: 2, reps: [10, 15], rir: 1, desc: 60 },
        { ej: "bird_dog", series: 2, reps: [6, 8], rir: 3, desc: 45, nota: "Por lado, 5–8 s cada una" },
        { ej: "paseo_granjero", series: 2, reps: [30, 45], rir: 2, desc: 90, nota: "Segundos, hombros atrás y abajo" },
      ]},
      { id: "CAR_LARGA", dia: "Sábado", nombre: "Cardio · tirada larga + movilidad", items: [
        { ej: "tirada_larga", presc: "45–75' suaves (que puedas hablar). Alternativa: bici 60–90'",
          notaReentrada: "Fase 0: 25–40' suaves, andando a ratos si hace falta" },
        { ej: "bloque_movilidad" },
      ]},
      { id: "EXTRA", dia: "Domingo (opcional)", nombre: "Descanso activo / rodaje suave", items: [
        { ej: "rodaje_suave", presc: "Opcional: 30–40' muy suaves o un paseo largo" },
        { ej: "cars" },
      ]},
      // Contra las horas sentado: 6–8 minutos, a diario (también los días de descanso)
      { id: "POSTURA", dia: "Cada día", nombre: "Rutina postural (6–8 min)", items: [
        { ej: "cat_camel" },
        { ej: "ext_toracica" },
        { ej: "chin_tuck" },
        { ej: "wall_slide", series: 2, reps: [8, 10], rir: 3, desc: 20 },
        { ej: "band_pull_apart", series: 2, reps: [15, 20], rir: 3, desc: 20, nota: "Si tienes una banda a mano" },
        { ej: "couch_stretch", nota: "1 min por lado" },
        { ej: "estir_pecho", nota: "1 min por lado" },
        { ej: "puente_gluteo", series: 1, reps: [10, 15], rir: 3, desc: 20, nota: "Por pierna" },
      ]},
    ],
  },
  P4: {
    nombre: "Plan mínimo · 4 días (2 cuerpo completo + 2 cardio)",
    sesiones: [
      { id: "FB_A", dia: "Lunes", nombre: "Cuerpo completo A", items: [
        { ej: "calentamiento_ramp" },
        { ej: "salto_cajon", series: 3, reps: [3, 3], rir: 3, desc: 60 },
        { ej: "sentadilla", series: 3, reps: [5, 8], rir: 2, desc: 180 },
        { ej: "press_banca", series: 3, reps: [5, 8], rir: 2, desc: 180 },
        { ej: "dominadas", series: 3, reps: [5, 10], rir: 2, desc: 150 },
        { ej: "rdl", series: 3, reps: [6, 10], rir: 2, desc: 150 },
        { ej: "elev_lateral_manc", series: 2, reps: [12, 20], rir: 0, desc: 60 },
        { ej: "ext_triceps_sobre_cabeza", series: 2, reps: [10, 15], rir: 1, desc: 60 },
        { ej: "curl_inclinado", series: 2, reps: [10, 15], rir: 1, desc: 60 },
        { ej: "gemelo_pie", series: 2, reps: [8, 12], rir: 1, desc: 60 },
      ]},
      { id: "FB_INT", dia: "Martes", nombre: "Cardio · 4×4", items: [
        { ej: "intervalos_4x4", presc: "10' suave + 4×4' fuertes / 3' suaves + 5' suave", notaReentrada: "Semanas 1–2: 30' suaves" },
        { ej: "bloque_movilidad" },
      ]},
      { id: "FB_B", dia: "Jueves", nombre: "Cuerpo completo B", items: [
        { ej: "calentamiento_ramp" },
        { ej: "skater", series: 3, reps: [5, 5], rir: 3, desc: 60 },
        { ej: "bulgara", series: 3, reps: [8, 12], rir: 1, desc: 90 },
        { ej: "press_inclinado_manc", series: 3, reps: [8, 12], rir: 1, desc: 120 },
        { ej: "remo_pecho_apoyado", series: 3, reps: [8, 12], rir: 1, desc: 90 },
        { ej: "hip_thrust", series: 2, reps: [8, 12], rir: 1, desc: 90 },
        { ej: "curl_femoral_sentado", series: 3, reps: [10, 15], rir: 1, desc: 90 },
        { ej: "fondos", series: 2, reps: [6, 12], rir: 1, desc: 90 },
        { ej: "face_pull", series: 2, reps: [12, 20], rir: 1, desc: 60 },
        { ej: "nordico", series: 2, reps: [4, 6], rir: 2, desc: 90 },
        { ej: "rueda_abdominal", series: 2, reps: [8, 12], rir: 2, desc: 60 },
      ]},
      { id: "FB_LARGA", dia: "Sábado", nombre: "Cardio · tirada larga", items: [
        { ej: "tirada_larga", presc: "45–75' suaves", notaReentrada: "Fase 0: 25–40' suaves" },
        { ej: "bloque_movilidad" },
      ]},
    ],
  },
};

// Fases: multiplican series y suman RIR.
const FASES = {
  reentrada: { nombre: "Fase 0 · Re-entrada (sem 1–3)", mult: 0.66, rirExtra: 1, nota: "Menos volumen, más margen. Prioriza la técnica. Tendones antes que ego." },
  construccion: { nombre: "Fase 1 · Construcción", mult: 1, rirExtra: 0, nota: "Volumen pleno. Doble progresión." },
  descarga: { nombre: "Descarga (1 semana)", mult: 0.5, rirExtra: 3, nota: "Mitad de series, lejos del fallo. Aprovecha para hacer los tests." },
};

// Tests periódicos (cada 6–12 semanas)
const TESTS = [
  { id: "peso", nombre: "Peso corporal", unidad: "kg", mejor: "info" },
  { id: "cintura", nombre: "Cintura (ombligo)", unidad: "cm", mejor: "menos" },
  { id: "fc_reposo", nombre: "FC en reposo (al despertar)", unidad: "lpm", mejor: "menos" },
  { id: "t5k", nombre: "Tiempo en 5 km (o test de Cooper)", unidad: "min", mejor: "menos" },
  { id: "flexiones_max", nombre: "Flexiones máximas", unidad: "reps", mejor: "mas" },
  { id: "dominadas_max", nombre: "Dominadas estrictas máximas", unidad: "reps", mejor: "mas" },
  { id: "colgado", nombre: "Colgado de la barra", unidad: "s", mejor: "mas" },
  { id: "salto_long", nombre: "Salto horizontal", unidad: "cm", mejor: "mas" },
  { id: "sit_reach", nombre: "Sit and reach (+ pasa los pies)", unidad: "cm", mejor: "mas" },
  { id: "sentadilla_prof", nombre: "Sentadilla profunda con talones abajo", unidad: "s", mejor: "mas" },
  { id: "agilidad_505", nombre: "Test 5-10-5", unidad: "s", mejor: "menos" },
];

// =====================================================================
// IMÁGENES: id de nuestro ejercicio -> id en free-exercise-db (dominio público)
// https://github.com/yuhonas/free-exercise-db  · cada uno tiene 0.jpg (inicio) y 1.jpg (final)
// Los que no tienen equivalente quedan sin imagen y muestran solo el enlace a vídeo.
// =====================================================================
const IMG_BASE = "img/";
const IMAGENES = {
  sentadilla: "Barbell_Full_Squat", sentadilla_frontal: "Front_Barbell_Squat", sentadilla_hack: "Hack_Squat",
  prensa: "Leg_Press", sentadilla_goblet: "Goblet_Squat", bulgara: "Split_Squat_with_Dumbbells",
  zancada_atras: "Dumbbell_Rear_Lunge", step_up: "Dumbbell_Step_Ups", extension_rodilla: "Leg_Extensions",
  sissy_squat: "Weighted_Sissy_Squat", pistol: "Kettlebell_Pistol_Squat",
  rdl: "Romanian_Deadlift", rdl_manc: "Stiff-Legged_Dumbbell_Deadlift", good_morning: "Good_Morning",
  peso_muerto: "Barbell_Deadlift", curl_femoral_sentado: "Seated_Leg_Curl", curl_femoral_tumbado: "Lying_Leg_Curls",
  nordico: "Natural_Glute_Ham_Raise", hip_thrust: "Barbell_Hip_Thrust", puente_gluteo: "Single_Leg_Glute_Bridge",
  kb_swing: "One-Arm_Kettlebell_Swings", abduccion_cadera: "Thigh_Abductor", aductor_maquina: "Thigh_Adductor",
  gemelo_pie: "Standing_Calf_Raises", gemelo_escalon: "Calf_Raise_On_A_Dumbbell", gemelo_sentado: "Seated_Calf_Raise",
  tibial: "Smith_Machine_Reverse_Calf_Raises",
  press_banca: "Barbell_Bench_Press_-_Medium_Grip", press_manc_plano: "Dumbbell_Bench_Press",
  press_inclinado_manc: "Incline_Dumbbell_Press", aperturas_polea: "Cable_Crossover", fondos: "Dips_-_Chest_Version",
  flexiones: "Pushups", flexiones_deficit: "Pushups", press_militar: "Standing_Military_Press",
  press_hombro_manc: "Seated_Dumbbell_Press", pike_pushup: "Handstand_Push-Ups",
  elev_lateral_manc: "Side_Lateral_Raise", elev_lateral_polea: "Cable_Seated_Lateral_Raise",
  ext_triceps_sobre_cabeza: "Cable_Rope_Overhead_Triceps_Extension", press_frances: "EZ-Bar_Skullcrusher",
  pushdown: "Triceps_Pushdown_-_Rope_Attachment",
  dominadas: "Pullups", jalon: "Wide-Grip_Lat_Pulldown", remo_barra: "Bent_Over_Barbell_Row",
  remo_pecho_apoyado: "Dumbbell_Incline_Row", remo_manc_1brazo: "One-Arm_Dumbbell_Row", remo_polea: "Seated_Cable_Rows",
  remo_invertido: "Inverted_Row", pullover_polea: "Straight-Arm_Pulldown", face_pull: "Face_Pull",
  pajaro: "Reverse_Flyes", encogimientos: "Dumbbell_Shrug",
  curl_inclinado: "Incline_Dumbbell_Curl", curl_barra: "Barbell_Curl", curl_martillo: "Hammer_Curls",
  paseo_granjero: "Farmers_Walk",
  rueda_abdominal: "Ab_Roller", plancha: "Plank", plancha_lateral: "Side_Bridge", dead_bug: "Dead_Bug",
  pallof: "Pallof_Press", elev_piernas_colgado: "Hanging_Leg_Raise", muscle_up: "Muscle_Up",
  salto_cajon: "Front_Box_Jump", salto_vertical: "Freehand_Jump_Squat", salto_horizontal: "Standing_Long_Jump",
  multisaltos: "Alternate_Leg_Diagonal_Bound", skater: "Lateral_Bound", comba: "Rope_Jumping",
  agilidad_conos: "Single-Cone_Sprint_Drill", sprint_cuesta: "Wind_Sprints", lanz_balon: "Medicine_Ball_Chest_Pass",
  rodaje_suave: "Jogging_Treadmill", tirada_larga: "Jogging_Treadmill", intervalos_4x4: "Running_Treadmill",
  tempo: "Running_Treadmill", sit: "Bicycling_Stationary", bici_suave: "Bicycling_Stationary",
  remo_ergo: "Rowing_Stationary", eliptica: "Elliptical_Trainer", caminar_inclinado: "Walking_Treadmill",
  calentamiento_ramp: "Worlds_Greatest_Stretch", worlds_greatest: "Worlds_Greatest_Stretch",
  couch_stretch: "Intermediate_Hip_Flexor_and_Quad_Stretch", estir_isquios: "Leg-Up_Hamstring_Stretch",
  estir_pecho: "One_Arm_Against_Wall", estir_gemelo: "Calf_Stretch_Hands_Against_Wall",
  hiperextension: "Hyperextensions_Back_Extensions", band_pull_apart: "Band_Pull_Apart",
  rotacion_externa: "External_Rotation_with_Cable", cat_camel: "Cat_Stretch",
};
const imgsDe = (id) => (IMAGENES[id] ? [0, 1].map((n) => `${IMG_BASE}${IMAGENES[id]}/${n}.jpg`) : []);
const videoDe = (e) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(e.nombre.replace(/\(.*?\)/g, "") + " técnica ejercicio");
