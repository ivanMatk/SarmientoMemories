document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       REFERENCIAS
    ===================================================== */
    const tablero = document.getElementById("tablero-memoria");
    const cartas = Array.from(tablero.querySelectorAll(".carta"));

    const movimientosTexto = document.getElementById("movimientos");
    const parejasTexto = document.getElementById("parejas-encontradas");

    const botonReiniciar = document.getElementById("reiniciar-juego");
    const botonEmpezar = document.getElementById("empezar-juego");
    const botonSonido = document.getElementById("control-sonido");
    const pantallaInicio = document.getElementById("pantalla-inicio");
    const barraProgreso = document.getElementById("progreso-barra");
    const progresoContenedor = document.getElementById("progreso-contenedor");
    const mensajeDinamico = document.getElementById("mensaje-dinamico");
    const mensajeLimite = document.getElementById("mensaje-limite");
    const botonReintentarLimite = document.getElementById("reintentar-limite");
    const botonCerrarHistoria = document.getElementById("cerrar-historia");
    const botonContinuar = document.getElementById("continuar-juego");

    const modalHistoria = document.getElementById("modal-historia");
    const imagenHistoria = document.getElementById("imagen-historia");
    const tituloHistoria = document.getElementById("titulo-historia");
    const contenidoHistoria = document.getElementById("contenido-historia");

    const mensajeFinal = document.getElementById("mensaje-final");
    const tituloFinal = document.getElementById("titulo-final");
    const movimientosFinal = document.getElementById("movimientos-final");
    const botonJugarDeNuevo = document.getElementById("jugar-de-nuevo");

    const TOTAL_PAREJAS = 6;
    const MAX_MOVIMIENTOS = 20;
    const COLUMNAS = 6;

    /* -----------------------------------------------------
       FOTOS DEL JUEGO
       Se buscan en la carpeta "imagenes" con estos nombres (en este orden de
       extensiones). Si todavía no está la foto nueva, se usa la anterior
       como respaldo para que el juego nunca quede vacío.
    ----------------------------------------------------- */
    const EXTENSIONES = ["jfif", "jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG", "JFIF", "jfifa"];
    const FOTOS = {
        museo:     { nombres: ["museo"],                              respaldo: "imagenes/museo.jpg" },
        bandera:   { nombres: ["bonaerense", "bandera"],              respaldo: "imagenes/monumento.jpg" },
        elisa:     { nombres: ["elisa"],                              respaldo: "imagenes/elisa.jpg" },
        cine:      { nombres: ["cine"],                               respaldo: "imagenes/cine.jpg" },
        balneario: { nombres: ["balneario"],                          respaldo: "imagenes/balneario.jpg" },
        plaza:     { nombres: ["sbnMartin", "sanMartin", "plaza"],    respaldo: "imagenes/plaza.jpg" },
        // La imagen de arriba de "Sarmiento Memories" en la portada:
        portada:   { nombres: ["portada", "Portada"],                 respaldo: "imagenes/capitansarmiento.jpg" },
        // La imagen que se arma en el rompecabezas y se ve al ganar:
        final:     { nombres: ["sarmiento", "Sarmiento"],             respaldo: "imagenes/capitansarmiento.jpg" }
    };
    const fotoResuelta = {};
    Object.keys(FOTOS).forEach(id => { fotoResuelta[id] = FOTOS[id].respaldo; });

    function existeImagen(url) {
        return new Promise(resolver => {
            const prueba = new Image();
            prueba.onload = () => resolver(true);
            prueba.onerror = () => resolver(false);
            prueba.src = url;
        });
    }

    async function buscarFoto(id) {
        for (const nombre of FOTOS[id].nombres) {
            for (const ext of EXTENSIONES) {
                const url = `imagenes/${nombre}.${ext}`;
                if (await existeImagen(url)) return url;
            }
        }
        return FOTOS[id].respaldo;
    }

    const fotosListas = Promise.all(
        Object.keys(FOTOS).map(async id => { fotoResuelta[id] = await buscarFoto(id); })
    );

    // Tiempos (ms). T_GIRO debe coincidir con la transición de .carta-giro en el CSS.
    const T_GIRO = 650;
    const T_BRILLO = 1650;
    const SEGUNDOS_MEMORIZAR = 4;

    const CANCELADO = Symbol("cancelado");
    const rnd = (a, b) => a + Math.random() * (b - a);
    const elegir = lista => lista[Math.floor(Math.random() * lista.length)];

    /* =====================================================
       SONIDO: música alegre + efectos (todo generado con Web Audio,
       no hace falta ningún archivo de audio)
    ===================================================== */
    const Sonido = (() => {
        const BPM = 132;
        const PASO = 60 / BPM / 2; // una corchea
        const SEMITONOS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const frecuencia = nombre => {
            const m = /^([A-G])(#?)(\d)$/.exec(nombre);
            const midi = 12 * (Number(m[3]) + 1) + SEMITONOS[m[1]] + (m[2] ? 1 : 0);
            return 440 * Math.pow(2, (midi - 69) / 12);
        };

        const ACORDES = {
            C:  { raiz: "C3", quinta: "G2", notas: ["C4", "E4", "G4"] },
            G:  { raiz: "G2", quinta: "D3", notas: ["B3", "D4", "G4"] },
            Am: { raiz: "A2", quinta: "E3", notas: ["A3", "C4", "E4"] },
            F:  { raiz: "F2", quinta: "C3", notas: ["A3", "C4", "F4"] }
        };

        // Dos secciones de 8 compases (8 corcheas por compás). "-" alarga la nota, "_" es silencio.
        const SECCIONES = [
            {
                acordes: ["C", "G", "Am", "F", "C", "G", "F", "G"],
                melodia: [
                    "E5 G5 E5 C5 E5 G5 C6 -",
                    "D5 G5 D5 B4 D5 G5 B5 _",
                    "C5 E5 A5 E5 C5 E5 A5 G5",
                    "A4 C5 F5 A5 G5 F5 E5 D5",
                    "E5 E5 G5 E5 C6 C6 G5 E5",
                    "D5 D5 G5 D5 B5 B5 G5 D5",
                    "A5 F5 A5 C6 A5 F5 D5 F5",
                    "D5 F5 G5 B5 D6 B5 G5 _"
                ]
            },
            {
                acordes: ["F", "C", "G", "Am", "F", "C", "G", "C"],
                melodia: [
                    "C6 A5 F5 A5 C6 A5 F5 _",
                    "E5 G5 C6 G5 E5 G5 C6 _",
                    "D5 G5 B5 G5 D6 B5 G5 _",
                    "E5 A5 C6 A5 E6 C6 A5 _",
                    "F5 F5 A5 C6 C6 A5 F5 A5",
                    "G5 G5 E5 C5 E5 G5 C6 _",
                    "B5 B5 D6 D6 B5 G5 D5 G5",
                    "C6 _ G5 _ E5 G5 C6 -"
                ]
            }
        ];
        const TOTAL_PASOS = SECCIONES.length * 8 * 8;

        // Prepara la melodía como una lista de notas por paso.
        const melodiaPorPaso = new Array(TOTAL_PASOS).fill(null);
        SECCIONES.forEach((seccion, s) => {
            let ultima = null;
            seccion.melodia.forEach((compas, c) => {
                compas.split(" ").forEach((ficha, i) => {
                    const paso = s * 64 + c * 8 + i;
                    if (ficha === "-" && ultima) {
                        ultima.duracion++;
                    } else if (ficha === "_" || ficha === "-") {
                        ultima = null;
                    } else {
                        ultima = { f: frecuencia(ficha), duracion: 1 };
                        melodiaPorPaso[paso] = ultima;
                    }
                });
            });
        });

        let ctx = null;
        let maestro = null;
        let busMusica = null;
        let busEfectos = null;
        let bufferRuido = null;
        let temporizador = null;
        let proximoTiempo = 0;
        let paso = 0;
        let silenciado = false;
        let iniciado = false;

        function crearContexto() {
            if (ctx) return ctx;
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            ctx = new Ctx();
            maestro = ctx.createGain();
            maestro.gain.value = silenciado ? 0 : 0.9;
            const compresor = ctx.createDynamicsCompressor();
            maestro.connect(compresor);
            compresor.connect(ctx.destination);
            busMusica = ctx.createGain();
            busMusica.gain.value = 0.5;
            busMusica.connect(maestro);
            busEfectos = ctx.createGain();
            busEfectos.gain.value = 1;
            busEfectos.connect(maestro);

            bufferRuido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const datos = bufferRuido.getChannelData(0);
            for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
            return ctx;
        }

        /* ---------- voces básicas ---------- */
        function tono({ f, t, dur, tipo = "sine", vol = 0.1, bus, filtro, f2, ataque = 0.008 }) {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = tipo;
            o.frequency.setValueAtTime(f, t);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + ataque);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            let salida = o;
            if (filtro) {
                const fl = ctx.createBiquadFilter();
                fl.type = "lowpass";
                fl.frequency.value = filtro;
                o.connect(fl);
                salida = fl;
            }
            salida.connect(g);
            g.connect(bus || busEfectos);
            o.start(t);
            o.stop(t + dur + 0.05);
        }

        function ruido({ t, dur, tipo = "highpass", f = 3000, f2, q = 1, vol = 0.1, bus }) {
            const fuente = ctx.createBufferSource();
            fuente.buffer = bufferRuido;
            const fl = ctx.createBiquadFilter();
            fl.type = tipo;
            fl.frequency.setValueAtTime(f, t);
            if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
            fl.Q.value = q;
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            fuente.connect(fl);
            fl.connect(g);
            g.connect(bus || busEfectos);
            fuente.start(t, Math.random() * 0.5);
            fuente.stop(t + dur + 0.05);
        }

        /* ---------- instrumentos de la canción ---------- */
        function melodia(f, t, dur) {
            const g = ctx.createGain();
            const fl = ctx.createBiquadFilter();
            fl.type = "lowpass";
            fl.frequency.value = 2700;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.07, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.03, t + dur * 0.55);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.98);
            ["square", "triangle"].forEach(tipo => {
                const o = ctx.createOscillator();
                o.type = tipo;
                o.frequency.value = f;
                o.connect(fl);
                o.start(t);
                o.stop(t + dur + 0.05);
            });
            fl.connect(g);
            g.connect(busMusica);
        }

        const bajo = (f, t, dur) => tono({ f, t, dur, tipo: "triangle", vol: 0.26, bus: busMusica, ataque: 0.01 });

        function acorde(notas, t, dur = 0.11) {
            notas.forEach(n => tono({ f: frecuencia(n), t, dur, tipo: "square", vol: 0.028, filtro: 1500, bus: busMusica, ataque: 0.005 }));
        }

        const bombo = t => tono({ f: 150, f2: 45, t, dur: 0.18, tipo: "sine", vol: 0.55, bus: busMusica, ataque: 0.004 });

        function caja(t, vol = 0.2) {
            ruido({ t, dur: 0.13, tipo: "bandpass", f: 1900, q: 0.8, vol, bus: busMusica });
            tono({ f: 200, f2: 130, t, dur: 0.09, tipo: "triangle", vol: 0.1, bus: busMusica });
        }

        const hat = (t, abierto) => ruido({ t, dur: abierto ? 0.13 : 0.04, tipo: "highpass", f: 7500, vol: abierto ? 0.07 : 0.05, bus: busMusica });

        function tocarPaso(p, t) {
            const compas = Math.floor(p / 8);
            const s = p % 8;
            const seccion = compas < 8 ? 0 : 1;
            const ac = ACORDES[SECCIONES[seccion].acordes[compas % 8]];

            const nota = melodiaPorPaso[p];
            if (nota) melodia(nota.f, t, nota.duracion * PASO);

            if (s === 0) bajo(frecuencia(ac.raiz), t, PASO * 1.8);
            if (s === 4) bajo(frecuencia(ac.quinta), t, PASO * 1.8);
            if (s === 2 || s === 6) acorde(ac.notas, t);
            if (s === 7 && compas % 2 === 1) acorde(ac.notas, t, 0.07);

            if (s === 0 || s === 4) bombo(t);
            if (s === 2 || s === 6) caja(t);
            if (compas % 4 === 3 && s === 5) caja(t, 0.08);
            if (s % 2 === 1) hat(t, s === 7);
        }

        function programar() {
            if (!ctx) return;
            while (proximoTiempo < ctx.currentTime + 0.18) {
                tocarPaso(paso, proximoTiempo);
                proximoTiempo += PASO;
                paso = (paso + 1) % TOTAL_PASOS;
            }
        }

        function iniciar() {
            if (!crearContexto()) return;
            if (ctx.state === "suspended") ctx.resume();
            if (iniciado) return;
            iniciado = true;
            proximoTiempo = ctx.currentTime + 0.1;
            programar();
            temporizador = setInterval(programar, 40);
        }

        function pausar(pausa) {
            if (!ctx || !iniciado) return;
            if (pausa) {
                ctx.suspend();
            } else {
                ctx.resume().then(() => { proximoTiempo = ctx.currentTime + 0.08; });
            }
        }

        function alternarSilencio() {
            silenciado = !silenciado;
            if (maestro) maestro.gain.setTargetAtTime(silenciado ? 0 : 0.9, ctx.currentTime, 0.03);
            return silenciado;
        }

        /* ---------- efectos ---------- */
        const EFECTOS = {
            voltear(t) {
                ruido({ t, dur: 0.15, tipo: "bandpass", f: 500, f2: 3500, q: 1.2, vol: 0.14 });
                tono({ f: 700, f2: 900, t: t + 0.12, dur: 0.05, tipo: "triangle", vol: 0.05 });
            },
            tic(t) {
                tono({ f: rnd(700, 1100), t, dur: 0.06, tipo: "triangle", vol: 0.05 });
            },
            barajar(t) {
                for (let i = 0; i < 9; i++) {
                    ruido({ t: t + i * 0.045, dur: 0.04, tipo: "bandpass", f: rnd(2200, 4200), q: 2, vol: 0.09 });
                }
            },
            acierto(t) {
                ["C6", "E6", "G6", "C7"].forEach((n, i) => {
                    tono({ f: frecuencia(n), t: t + i * 0.075, dur: 0.28, tipo: "triangle", vol: 0.09 });
                    tono({ f: frecuencia(n) * 2, t: t + i * 0.075, dur: 0.18, tipo: "sine", vol: 0.025 });
                });
            },
            brillo(t) {
                for (let i = 0; i < 7; i++) {
                    tono({ f: rnd(1800, 4200), t: t + i * 0.07, dur: 0.22, tipo: "sine", vol: 0.035 });
                }
            },
            error(t) {
                tono({ f: 330, f2: 120, t, dur: 0.4, tipo: "sawtooth", vol: 0.09, filtro: 900 });
                tono({ f: 250, f2: 90, t: t + 0.18, dur: 0.4, tipo: "sawtooth", vol: 0.07, filtro: 800 });
            },
            encaja(t) {
                tono({ f: 523, f2: 880, t, dur: 0.14, tipo: "triangle", vol: 0.09 });
                tono({ f: 1046, t: t + 0.1, dur: 0.16, tipo: "sine", vol: 0.05 });
            },
            romper(t) {
                ruido({ t, dur: 0.07, tipo: "highpass", f: 2500, vol: 0.38 });
                ruido({ t: t + 0.06, dur: 0.05, tipo: "highpass", f: 3500, vol: 0.28 });
                tono({ f: 140, f2: 60, t, dur: 0.15, tipo: "sine", vol: 0.25 });
                for (let i = 0; i < 12; i++) {
                    tono({ f: rnd(2500, 7000), t: t + rnd(0.1, 1), dur: 0.14, tipo: "sine", vol: 0.04 });
                }
            },
            silbido(t) {
                tono({ f: 600, f2: 2300, t, dur: 0.7, tipo: "sine", vol: 0.018, ataque: 0.05 });
            },
            pop(t) {
                ruido({ t, dur: 0.22, tipo: "lowpass", f: 1500, vol: 0.3 });
                tono({ f: 130, f2: 45, t, dur: 0.18, tipo: "sine", vol: 0.3 });
                for (let i = 0; i < 6; i++) {
                    ruido({ t: t + rnd(0.1, 0.6), dur: 0.03, tipo: "highpass", f: 6000, vol: 0.05 });
                }
            },
            fanfarria(t) {
                [["G4", 0], ["C5", 0.13], ["E5", 0.26]].forEach(([n, d]) => {
                    tono({ f: frecuencia(n), t: t + d, dur: 0.16, tipo: "sawtooth", vol: 0.07, filtro: 2400 });
                });
                ["C5", "E5", "G5", "C6"].forEach(n => {
                    tono({ f: frecuencia(n), t: t + 0.4, dur: 1.1, tipo: "sawtooth", vol: 0.055, filtro: 2400, ataque: 0.02 });
                });
                ruido({ t: t + 0.4, dur: 1, tipo: "highpass", f: 6000, vol: 0.1 });
            }
        };

        function efecto(nombre, retraso = 0) {
            if (!ctx || !EFECTOS[nombre]) return;
            EFECTOS[nombre](ctx.currentTime + retraso / 1000 + 0.01);
        }

        return { iniciar, pausar, alternarSilencio, efecto };
    })();

    const efecto = (nombre, retraso) => Sonido.efecto(nombre, retraso);

    /* =====================================================
       FIESTA FINAL: fuegos artificiales + serpentinas + papelitos
    ===================================================== */
    const Fiesta = (() => {
        const lienzoFuegos = document.getElementById("lienzo-fuegos");
        const lienzoCintas = document.getElementById("lienzo-cintas");
        const cf = lienzoFuegos.getContext("2d");
        const cc = lienzoCintas.getContext("2d");
        const COLORES = ["#e63946", "#f4a000", "#3a9d23", "#0055a4", "#6a3fa0", "#ff7a00", "#12a594", "#e0489a"];

        const cohetes = [];
        const chispas = [];
        const listones = [];
        const papeles = [];
        let ancho = 0;
        let alto = 0;
        let raf = 0;
        let corriendo = false;
        let ultimo = 0;
        let siguienteCohete = 0;
        let siguienteLluvia = 0;
        let siguienteCanon = 0;
        let inicio = 0;
        let pendientes = [];

        function ajustar() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            ancho = window.innerWidth;
            alto = window.innerHeight;
            [[lienzoFuegos, cf], [lienzoCintas, cc]].forEach(([lienzo, c]) => {
                lienzo.width = Math.round(ancho * dpr);
                lienzo.height = Math.round(alto * dpr);
                lienzo.style.width = `${ancho}px`;
                lienzo.style.height = `${alto}px`;
                c.setTransform(dpr, 0, 0, dpr, 0, 0);
            });
        }

        /* --- fuegos artificiales --- */
        function lanzarCohete(x) {
            cohetes.push({
                // la mayoría explota a los costados, donde no los tapa la tarjeta
                x: x ?? (Math.random() < 0.75
                    ? (Math.random() < 0.5 ? rnd(ancho * 0.05, ancho * 0.26) : rnd(ancho * 0.74, ancho * 0.95))
                    : rnd(ancho * 0.3, ancho * 0.7)),
                y0: alto + 10,
                y: alto + 10,
                ty: rnd(alto * 0.12, alto * 0.48),
                t: 0,
                dur: rnd(0.8, 1.25),
                color: elegir(COLORES)
            });
            efecto("silbido");
        }

        function explotar(x, y, color) {
            const forma = Math.random();
            const color2 = elegir(COLORES);
            const n = forma < 0.2 ? 80 : 90;
            for (let i = 0; i < n; i++) {
                const ang = (i / n) * Math.PI * 2;
                let vx;
                let vy;
                if (forma < 0.2) { // corazón
                    vx = 16 * Math.pow(Math.sin(ang), 3) * 0.3;
                    vy = -(13 * Math.cos(ang) - 5 * Math.cos(2 * ang) - 2 * Math.cos(3 * ang) - Math.cos(4 * ang)) * 0.3;
                } else if (forma < 0.5) { // anillo
                    vx = Math.cos(ang) * 4.4;
                    vy = Math.sin(ang) * 4.4;
                } else { // peonía
                    const vel = rnd(1.2, 6);
                    const a = rnd(0, Math.PI * 2);
                    vx = Math.cos(a) * vel;
                    vy = Math.sin(a) * vel;
                }
                chispas.push({
                    x, y, vx, vy,
                    vida: 1,
                    decay: rnd(0.008, 0.015),
                    color: forma > 0.7 && i % 2 ? color2 : color,
                    tam: rnd(2.4, 4.2)
                });
            }
            efecto("pop");
        }

        function actualizarFuegos(f) {
            for (let i = cohetes.length - 1; i >= 0; i--) {
                const c = cohetes[i];
                c.t += (f / 60) / c.dur;
                const e = 1 - Math.pow(1 - Math.min(c.t, 1), 2);
                c.y = c.y0 + (c.ty - c.y0) * e;
                chispas.push({ x: c.x + rnd(-1, 1), y: c.y, vx: rnd(-0.3, 0.3), vy: rnd(0.4, 1.4), vida: 0.6, decay: 0.03, color: "#e0a030", tam: 1.8 });
                if (c.t >= 1) {
                    explotar(c.x, c.y, c.color);
                    cohetes.splice(i, 1);
                }
            }
            const drag = Math.pow(0.985, f);
            for (let i = chispas.length - 1; i >= 0; i--) {
                const s = chispas[i];
                s.vx *= drag;
                s.vy = s.vy * drag + 0.045 * f;
                s.x += s.vx * f;
                s.y += s.vy * f;
                s.vida -= s.decay * f;
                if (s.vida <= 0) chispas.splice(i, 1);
            }
        }

        function dibujarFuegos() {
            cf.globalCompositeOperation = "destination-out";
            cf.fillStyle = "rgba(0,0,0,0.2)";
            cf.fillRect(0, 0, ancho, alto);
            cf.globalCompositeOperation = "lighter";
            chispas.forEach(s => {
                cf.globalAlpha = Math.max(0, Math.min(1, s.vida));
                cf.fillStyle = s.color;
                cf.beginPath();
                cf.arc(s.x, s.y, s.tam * (0.5 + s.vida * 0.5), 0, Math.PI * 2);
                cf.fill();
                // halo suave alrededor de cada chispa
                cf.globalAlpha = Math.max(0, Math.min(1, s.vida)) * 0.25;
                cf.beginPath();
                cf.arc(s.x, s.y, s.tam * 2.6, 0, Math.PI * 2);
                cf.fill();
            });
            cf.globalAlpha = 1;
            cohetes.forEach(c => {
                cf.fillStyle = "#ff9f1c";
                cf.beginPath();
                cf.arc(c.x, c.y, 2.6, 0, Math.PI * 2);
                cf.fill();
            });
        }

        /* --- serpentinas y papelitos --- */
        function nuevoListon(x, y, vx, vy) {
            listones.push({
                x, y, vx, vy,
                color: elegir(COLORES),
                ancho: rnd(3, 6.5),
                largo: Math.floor(rnd(16, 32)),
                fase: rnd(0, 6.28),
                puntos: []
            });
        }

        function nuevoPapel(x, y, vx, vy) {
            papeles.push({
                x, y, vx, vy,
                color: elegir(COLORES),
                w: rnd(6, 11),
                h: rnd(9, 16),
                rot: rnd(0, 6.28),
                vr: rnd(-0.2, 0.2),
                fase: rnd(0, 6.28)
            });
        }

        function canon(lado) {
            const x = lado < 0 ? ancho * 0.03 : ancho * 0.97;
            const y = alto * 0.98;
            const fuerza = alto * 0.045;
            // lado -1: cañón de la izquierda (dispara hacia la derecha); lado 1: al revés.
            const haciaAdentro = lado < 0 ? 1 : -1;
            for (let i = 0; i < 26; i++) {
                const ang = (-Math.PI / 2) + haciaAdentro * rnd(0.12, 0.85);
                const v = rnd(0.55, 1) * fuerza;
                nuevoListon(x, y, Math.cos(ang) * v, Math.sin(ang) * v);
            }
            for (let i = 0; i < 70; i++) {
                const ang = (-Math.PI / 2) + haciaAdentro * rnd(0.1, 0.9);
                const v = rnd(0.4, 1) * fuerza;
                nuevoPapel(x, y, Math.cos(ang) * v, Math.sin(ang) * v);
            }
            efecto("pop");
        }

        function actualizarCintas(f) {
            const dragL = Math.pow(0.94, f);
            for (let i = listones.length - 1; i >= 0; i--) {
                const l = listones[i];
                l.fase += 0.22 * f;
                l.vx = l.vx * dragL + Math.sin(l.fase) * 0.45 * f;
                l.vy = l.vy * dragL + 0.22 * f;
                l.x += l.vx * f;
                l.y += l.vy * f;
                l.puntos.unshift({ x: l.x, y: l.y });
                if (l.puntos.length > l.largo) l.puntos.pop();
                if (l.y - l.largo * 5 > alto + 40) listones.splice(i, 1);
            }
            const dragP = Math.pow(0.95, f);
            for (let i = papeles.length - 1; i >= 0; i--) {
                const p = papeles[i];
                p.fase += 0.15 * f;
                p.vx = p.vx * dragP + Math.sin(p.fase * 0.7) * 0.12 * f;
                p.vy = p.vy * dragP + 0.12 * f;
                p.x += p.vx * f;
                p.y += p.vy * f;
                p.rot += p.vr * f;
                if (p.y > alto + 30) papeles.splice(i, 1);
            }
        }

        function dibujarCintas() {
            cc.clearRect(0, 0, ancho, alto);
            cc.lineCap = "round";
            cc.lineJoin = "round";
            listones.forEach(l => {
                const pts = l.puntos;
                if (pts.length < 3) return;
                cc.strokeStyle = l.color;
                cc.lineWidth = l.ancho;
                cc.beginPath();
                cc.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length - 1; i++) {
                    const mx = (pts[i].x + pts[i + 1].x) / 2;
                    const my = (pts[i].y + pts[i + 1].y) / 2;
                    cc.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
                }
                cc.stroke();
            });
            papeles.forEach(p => {
                cc.save();
                cc.translate(p.x, p.y);
                cc.rotate(p.rot);
                cc.scale(1, Math.cos(p.fase));
                cc.fillStyle = p.color;
                cc.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                cc.restore();
            });
        }

        /* --- bucle --- */
        function cuadro(ahora) {
            if (!corriendo) return;
            const dt = Math.min((ahora - ultimo) / 1000, 0.05);
            ultimo = ahora;
            const f = dt * 60;
            const transcurrido = ahora - inicio;

            if (ahora >= siguienteCohete) {
                lanzarCohete();
                siguienteCohete = ahora + rnd(380, 800);
            }
            if (ahora >= siguienteLluvia) {
                nuevoListon(rnd(0, ancho), -20, rnd(-1, 1), rnd(1, 2.5));
                nuevoPapel(rnd(0, ancho), -20, rnd(-1.5, 1.5), rnd(1, 2));
                nuevoPapel(rnd(0, ancho), -20, rnd(-1.5, 1.5), rnd(1, 2));
                siguienteLluvia = ahora + 230;
            }
            if (ahora >= siguienteCanon && transcurrido > 6000) {
                canon(-1);
                canon(1);
                siguienteCanon = ahora + 7000;
            }

            actualizarFuegos(f);
            actualizarCintas(f);
            dibujarFuegos();
            dibujarCintas();
            raf = requestAnimationFrame(cuadro);
        }

        function iniciar() {
            detener();
            ajustar();
            corriendo = true;
            ultimo = performance.now();
            inicio = ultimo;
            siguienteCohete = ultimo + 250;
            siguienteLluvia = ultimo + 500;
            siguienteCanon = ultimo + 9e9;
            pendientes = [
                setTimeout(() => canon(-1), 80),
                setTimeout(() => canon(1), 260),
                setTimeout(() => { canon(-1); canon(1); }, 1900)
            ];
            raf = requestAnimationFrame(cuadro);
            setTimeout(() => { siguienteCanon = performance.now() + 5000; }, 100);
        }

        function detener() {
            corriendo = false;
            cancelAnimationFrame(raf);
            pendientes.forEach(clearTimeout);
            pendientes = [];
            cohetes.length = 0;
            chispas.length = 0;
            listones.length = 0;
            papeles.length = 0;
            cf.clearRect(0, 0, ancho, alto);
            cc.clearRect(0, 0, ancho, alto);
        }

        window.addEventListener("resize", () => { if (corriendo) ajustar(); });
        return { iniciar, detener };
    })();

    /* =====================================================
       ESTADO DEL JUEGO
    ===================================================== */
    let primeraCarta = null;
    let segundaCarta = null;
    let movimientos = 0;
    let parejasEncontradas = 0;
    let bloqueado = true;
    let historiaPendiente = null;
    let partidaTerminada = false;
    let racha = 0;
    let fase = "portada"; // portada | memorizar | mezclando | jugando | final
    let idPartida = 0;
    let imagenFinalProporcion = 1;

    const esperar = (ms, id = idPartida) =>
        new Promise((resolver, rechazar) => {
            setTimeout(() => (id === idPartida ? resolver() : rechazar(CANCELADO)), ms);
        });

    const ejecutar = async tarea => {
        try {
            await tarea();
        } catch (error) {
            if (error !== CANCELADO) console.error(error);
        }
    };

    const historias = {
        museo: {
            titulo: "El Museo Histórico",
            resumen: "Fotos, mapas y objetos que cuentan cómo era el pueblo.",
            texto: `
                <p><strong>Fotos, mapas y objetos que cuentan cómo era el pueblo.</strong></p>
                <p>El Museo y Archivo Histórico Municipal guarda la memoria de Capitán Sarmiento: fotografías, mapas, diarios y documentos que muestran cómo nació y creció el pueblo. También conserva elementos del ferrocarril y objetos de oficios tradicionales, como radios, vitrolas y cámaras fotográficas, y tiene una sala dedicada a la Bandera Bonaerense. Funciona en el edificio de la antigua estación, que se habilitó en 1882 y dejó de funcionar como estación en 1992. Fue restaurado y reinaugurado en octubre de 2005 como Museo Centro Cultural y Casa de la Cultura.</p>
            `,
            fuente: "Instituto Cultural de la Provincia de Buenos Aires (ficha del museo); elDiarioAR; El Cronista; Hispanopedia."
        },
        plaza: {
            titulo: "La Plaza San Martín",
            resumen: "El gran espacio verde del pueblo, a tres cuadras de la estación.",
            texto: `
                <p><strong>El gran espacio verde del pueblo, a tres cuadras de la estación.</strong></p>
                <p>La plaza San Martín está a tres cuadras de la estación, entre las avenidas Roque Sáenz Peña y Bartolomé Mitre. Es el espacio público más importante de la ciudad y el lugar de encuentro de los vecinos. Su construcción comenzó en la primera mitad del siglo XX.</p>
            `,
            fuente: "“Capitán Sarmiento: Reflexiones y datos para una estrategia de desarrollo” (UNLP)."
        },
        balneario: {
            titulo: "El Balneario",
            resumen: "Lago, piletas y camping para pasar el día.",
            texto: `
                <p><strong>Lago, piletas y camping para pasar el día.</strong></p>
                <p>El Balneario Municipal está a unos 5 km del centro, sobre la Ruta 8. Es un parque natural a orillas de un lago, con piletas de agua fría y caliente, camping con cabañas y actividades como kayak, tirolesa y pesca. Es uno de los paseos preferidos de vecinos y visitantes.</p>
            `,
            fuente: "El Cronista; Hispanopedia, Partido de Capitán Sarmiento."
        },
        bandera: {
            titulo: "La Bandera Bonaerense",
            resumen: "Cinco alumnos del pueblo diseñaron la bandera de la provincia.",
            texto: `
                <p><strong>Cinco alumnos del pueblo diseñaron la bandera de la provincia.</strong></p>
                <p>El 12 de agosto de 1997 se hizo el escrutinio final del concurso escolar “Buscando la bandera bonaerense”, en el que votaron casi dos millones de jóvenes y sus familias. Ganó el diseño de cinco alumnos de las escuelas de educación media N.º 1 “Mateo Jelicich” y N.º 2 “Domingo Faustino Sarmiento”, de Capitán Sarmiento. La jura de lealtad se hizo el 28 de septiembre de 1997 en Luján y la ciudad fue declarada “Cuna de la Bandera Bonaerense”. Después la Ley 11.997 adoptó esa bandera y la Ley 14.290 dispuso levantar en el pueblo un monumento en su honor.</p>
            `,
            fuente: "Gobierno de la Provincia de Buenos Aires; Sistema de Información Normativa (Ley 11.997, Ley 14.290, Decreto 2979/1997); Cámara de Diputados bonaerense; Hispanopedia."
        },
        elisa: {
            titulo: "El Palacio de La Elisa",
            resumen: "Una de las estancias históricas del pueblo.",
            texto: `
                <p><strong>Una de las estancias históricas del pueblo.</strong></p>
                <p>La estancia La Elisa es una de las estancias históricas del partido de Capitán Sarmiento y figura entre sus establecimientos más destacados. Su casco principal es conocido como “el palacio”. En 2018 abrió sus puertas para recibir un almuerzo de la peregrinación latinoamericana de enfermos al Santuario de Luján.</p>
            `,
            fuente: "Historia local de Capitán Sarmiento (capitansarmiento.wordpress.com); Orden de Malta Argentina (nota de septiembre de 2018)."
        },
        cine: {
            titulo: "El Cine Ítalo Argentino",
            resumen: "La sala de la Sociedad Italiana de Socorros Mutuos.",
            texto: `
                <p><strong>La sala de la Sociedad Italiana de Socorros Mutuos.</strong></p>
                <p>El 20 de septiembre de 1889, Pedro Diale y quince compatriotas fundaron la Sociedad Italiana de Socorros Mutuos “Roma Intangibile”, la mutual más antigua del pueblo, para ayudarse entre sí y aliviar la nostalgia de su tierra. En 1924 empezaron a reunir fondos para construir un gran teatro, y el 3 de abril de 1929 se inauguró el Cine Teatro Ítalo Argentino. Su nombre se eligió por aclamación en la asamblea de inauguración y une las dos tierras de sus socios. Tiene 500 butacas y durante décadas fue el corazón de la vida cultural del pueblo, con cine, teatro y bailes. Más de 135 años después, sigue abierto a toda la comunidad.</p>
            `,
            fuente: "Historia y fotografía: sitio oficial del Cine Teatro Ítalo Argentino (cineitalocapitansarmiento.com)."
        }
    };

    /* =====================================================
       PREPARAR LAS CARTAS 3D
       Cada carta queda con dos caras: el dorso ("?") y el frente (foto).
       El frente también guarda la pieza del rompecabezas final.
    ===================================================== */
    function geometriaPieza(columna, fila) {
        // La foto final se acomoda "cubriendo" el tablero de 6 x 2 cartas (cada carta es 3:4).
        const anchoTablero = COLUMNAS;
        const altoTablero = 2 * (4 / 3);
        const proporcion = imagenFinalProporcion;
        let anchoImg;
        let altoImg;
        if (proporcion < anchoTablero / altoTablero) {
            anchoImg = anchoTablero;
            altoImg = anchoTablero / proporcion;
        } else {
            altoImg = altoTablero;
            anchoImg = altoTablero * proporcion;
        }
        const recorteX = (anchoImg - anchoTablero) / 2;
        const recorteY = (altoImg - altoTablero) / 2;
        const px = anchoImg === 1 ? 0 : ((columna + recorteX) / (anchoImg - 1)) * 100;
        const py = altoImg === 4 / 3 ? 0 : ((fila * (4 / 3) + recorteY) / (altoImg - 4 / 3)) * 100;
        return { bgW: anchoImg * 100, bgH: (altoImg / (4 / 3)) * 100, px, py };
    }

    function colocarPiezas() {
        cartas.forEach(carta => {
            const indice = Number(carta.dataset.posicionFinal);
            const g = geometriaPieza(indice % COLUMNAS, Math.floor(indice / COLUMNAS));
            carta.style.setProperty("--bg-w", `${g.bgW}%`);
            carta.style.setProperty("--bg-h", `${g.bgH}%`);
            carta.style.setProperty("--px", `${g.px}%`);
            carta.style.setProperty("--py", `${g.py}%`);
        });
    }

    function prepararTablero() {
        cartas.forEach((carta, indice) => {
            carta.dataset.posicionFinal = indice;
            carta.setAttribute("aria-pressed", "false");

            const foto = carta.querySelector("img");
            const crear = clase => {
                const e = document.createElement("span");
                e.className = clase;
                return e;
            };
            const escena = crear("carta-escena");
            const giro = crear("carta-giro");
            const dorso = crear("cara dorso");
            const frente = crear("cara frente");
            const pieza = crear("pieza");
            dorso.setAttribute("aria-hidden", "true");
            dorso.textContent = "?";
            pieza.setAttribute("aria-hidden", "true");

            frente.append(foto, pieza);
            giro.append(dorso, frente);
            escena.append(giro);
            carta.append(escena);
        });

        colocarPiezas();
    }

    // Cuando se encontraron las fotos, se colocan en las cartas, la portada, el rompecabezas y la pantalla final.
    function aplicarFotos() {
        cartas.forEach(carta => {
            const foto = carta.querySelector("img");
            const id = carta.dataset.id;
            if (foto && fotoResuelta[id]) foto.src = fotoResuelta[id];
        });
        document.querySelectorAll("[data-foto]").forEach(foto => {
            const id = foto.dataset.foto;
            if (fotoResuelta[id]) foto.src = fotoResuelta[id];
        });

        const urlFinal = fotoResuelta.final;
        tablero.style.setProperty("--img-final", `url("${urlFinal}")`);
        const imagenGrande = document.getElementById("imagen-final");
        if (imagenGrande) imagenGrande.src = urlFinal;

        const medida = new Image();
        medida.onload = () => {
            imagenFinalProporcion = medida.naturalWidth / medida.naturalHeight;
            colocarPiezas();
        };
        medida.src = urlFinal;
    }

    /* =====================================================
       UTILIDADES VISUALES
    ===================================================== */
    function actualizarContadores(animar) {
        const antesMov = movimientosTexto.textContent;
        const antesPar = parejasTexto.textContent;
        movimientosTexto.textContent = movimientos;
        parejasTexto.textContent = parejasEncontradas;
        if (barraProgreso) {
            barraProgreso.style.width = `${(parejasEncontradas / TOTAL_PAREJAS) * 100}%`;
            progresoContenedor.setAttribute("aria-valuenow", parejasEncontradas);
        }
        if (animar) {
            if (antesMov !== String(movimientos)) rebotar(movimientosTexto);
            if (antesPar !== String(parejasEncontradas)) rebotar(parejasTexto);
        }
    }

    function rebotar(elemento) {
        elemento.classList.remove("rebote");
        void elemento.offsetWidth;
        elemento.classList.add("rebote");
    }

    function mensajeMomentaneo(texto) {
        mensajeDinamico.textContent = texto;
        mensajeDinamico.classList.remove("mensaje-entra");
        void mensajeDinamico.offsetWidth;
        mensajeDinamico.classList.add("mensaje-entra");
    }

    function lanzarConfeti(cantidad = 24) {
        const colores = ["#ffd166", "#25d9c3", "#367bff", "#ffffff", "#ff7b9c"];
        for (let i = 0; i < cantidad; i++) {
            const pieza = document.createElement("span");
            pieza.className = "confeti";
            pieza.style.left = `${Math.random() * 100}%`;
            pieza.style.background = colores[i % colores.length];
            pieza.style.setProperty("--giro", `${Math.random() * 720 - 360}deg`);
            pieza.style.setProperty("--duracion", `${1.4 + Math.random() * 1.5}s`);
            document.body.appendChild(pieza);
            setTimeout(() => pieza.remove(), 3100);
        }
    }

    // Estrellitas que salen de una carta cuando acierta.
    function chispasDeCarta(carta) {
        const r = carta.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        for (let i = 0; i < 9; i++) {
            const chispa = document.createElement("span");
            chispa.className = "chispa";
            chispa.textContent = elegir(["✨", "⭐", "✦", "💫"]);
            chispa.style.left = `${cx}px`;
            chispa.style.top = `${cy}px`;
            chispa.style.fontSize = `${rnd(14, 26)}px`;
            document.body.appendChild(chispa);
            const ang = (i / 9) * Math.PI * 2 + rnd(-0.3, 0.3);
            const dist = rnd(r.width * 0.6, r.width * 1.3);
            const animacion = chispa.animate([
                { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 0 },
                { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 0.6}px), calc(-50% + ${Math.sin(ang) * dist * 0.6}px)) scale(1.2) rotate(120deg)`, opacity: 1, offset: 0.4 },
                { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 14}px)) scale(0.2) rotate(260deg)`, opacity: 0 }
            ], { duration: rnd(900, 1300), delay: rnd(0, 250), easing: "ease-out", fill: "both" });
            animacion.onfinish = () => chispa.remove();
        }
    }

    function comprobarLimite() {
        if (movimientos >= MAX_MOVIMIENTOS && parejasEncontradas < TOTAL_PAREJAS) {
            partidaTerminada = true;
            mensajeLimite.hidden = false;
            mensajeLimite.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function mezclarCartas() {
        const mezcladas = [...cartas];
        for (let i = mezcladas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
        }
        mezcladas.forEach(carta => tablero.appendChild(carta));
    }

    function cancelarAnimaciones() {
        cartas.forEach(carta => {
            carta.getAnimations().forEach(a => a.cancel());
            carta.style.zIndex = "";
        });
    }

    /* =====================================================
       PORTADA: las fotos se rompen en pedacitos y caen
    ===================================================== */
    function romperFotos() {
        const fotos = Array.from(pantallaInicio.querySelectorAll(".foto-flotante"));
        const columnas = 4;
        const filas = 3;
        let duracionMaxima = 0;

        fotos.forEach((foto, k) => {
            const estilo = getComputedStyle(foto);
            if (estilo.display === "none" || !foto.offsetWidth) return;

            const W = foto.offsetWidth;
            const H = foto.offsetHeight;
            const matriz = new DOMMatrix(estilo.transform === "none" ? undefined : estilo.transform);
            const angulo = Math.atan2(matriz.b, matriz.a);
            const cos = Math.cos(angulo);
            const sen = Math.sin(angulo);
            const demora = k * 70;

            const contenedor = document.createElement("div");
            contenedor.className = "trozos";
            Object.assign(contenedor.style, {
                left: `${foto.offsetLeft}px`,
                top: `${foto.offsetTop}px`,
                width: `${W}px`,
                height: `${H}px`,
                transform: estilo.transform === "none" ? "" : estilo.transform
            });

            // Puntos de la grilla con un poco de desorden para que los cortes parezcan vidrio roto.
            const puntos = [];
            for (let f = 0; f <= filas; f++) {
                puntos[f] = [];
                for (let c = 0; c <= columnas; c++) {
                    const borde = f === 0 || c === 0 || f === filas || c === columnas;
                    const jx = borde && (c === 0 || c === columnas) ? 0 : rnd(-0.28, 0.28) * (W / columnas);
                    const jy = borde && (f === 0 || f === filas) ? 0 : rnd(-0.28, 0.28) * (H / filas);
                    puntos[f][c] = [(c * W) / columnas + jx, (f * H) / filas + jy];
                }
            }

            const triangulos = [];
            for (let f = 0; f < filas; f++) {
                for (let c = 0; c < columnas; c++) {
                    const a = puntos[f][c];
                    const b = puntos[f][c + 1];
                    const d = puntos[f + 1][c + 1];
                    const e = puntos[f + 1][c];
                    if (Math.random() < 0.5) {
                        triangulos.push([a, b, d], [a, d, e]);
                    } else {
                        triangulos.push([a, b, e], [b, d, e]);
                    }
                }
            }

            triangulos.forEach(tri => {
                const trozo = document.createElement("img");
                trozo.src = foto.src;
                trozo.alt = "";
                trozo.className = "trozo";
                const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
                const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
                Object.assign(trozo.style, {
                    width: `${W}px`,
                    height: `${H}px`,
                    padding: estilo.padding,
                    border: estilo.border,
                    borderRadius: estilo.borderRadius,
                    clipPath: `polygon(${tri.map(p => `${p[0]}px ${p[1]}px`).join(",")})`,
                    transformOrigin: `${cx}px ${cy}px`
                });
                contenedor.appendChild(trozo);

                // Hacia dónde sale disparado cada pedazo (en pantalla) y cuánto cae.
                const ox = cx - W / 2;
                const oy = cy - H / 2;
                const norma = Math.hypot(ox, oy) || 1;
                const empuje = rnd(40, 150);
                const mundoX = (ox / norma) * empuje;
                const mundoY = (oy / norma) * empuje * 0.5 - rnd(30, 90);
                const caidaX = mundoX * 1.4 + rnd(-70, 70);
                const caidaY = alto() - foto.offsetTop + rnd(120, 320);
                const local = (x, y) => [x * cos + y * sen, -x * sen + y * cos];
                const [bx, by] = local(mundoX, mundoY);
                const [fx, fy] = local(caidaX, caidaY);
                const giro = rnd(-540, 540);
                const duracion = rnd(1100, 1500);
                duracionMaxima = Math.max(duracionMaxima, demora + 260 + duracion);

                trozo.animate([
                    { transform: "translate(0,0) rotate(0deg)", easing: "ease-out" },
                    { transform: `translate(${bx}px,${by}px) rotate(${giro * 0.2}deg)`, offset: 0.2, easing: "cubic-bezier(.5,0,.9,.55)" },
                    { transform: `translate(${fx}px,${fy}px) rotate(${giro}deg)` }
                ], { duration: duracion, delay: demora + 260 + rnd(0, 120), fill: "both" });
            });

            // Se agrieta (pequeño temblor) y se oculta la foto entera.
            foto.style.visibility = "hidden";
            foto.parentNode.appendChild(contenedor);
            const base = estilo.transform === "none" ? "" : `${estilo.transform} `;
            contenedor.animate([
                { transform: `${base}scale(1)` },
                { transform: `${base}scale(1.05) rotate(-1.5deg)` },
                { transform: `${base}scale(.99) rotate(1.5deg)` },
                { transform: `${base}scale(1.03)` }
            ], { duration: 260, delay: demora });
            efecto("romper", demora + 200);
        });

        return duracionMaxima + 100;
    }

    const alto = () => window.innerHeight;

    /* =====================================================
       COMIENZO DE CADA PARTIDA:
       1) se muestran todas las imágenes  2) se dan vuelta  3) se mezclan
    ===================================================== */
    function reiniciarEstado() {
        idPartida++;
        cancelarAnimaciones();
        document.querySelectorAll(".chispa").forEach(e => e.remove());
        Fiesta.detener();

        if (modalHistoria.open && typeof modalHistoria.close === "function") modalHistoria.close();
        else modalHistoria.removeAttribute("open");

        movimientos = 0;
        parejasEncontradas = 0;
        primeraCarta = null;
        segundaCarta = null;
        bloqueado = true;
        historiaPendiente = null;
        partidaTerminada = false;
        racha = 0;

        mensajeFinal.hidden = true;
        mensajeLimite.hidden = true;
        document.body.classList.remove("final-abierto");
        mensajeDinamico.textContent = "";

        tablero.classList.add("sin-transicion");
        tablero.classList.remove("ensamblado");
        cartas.forEach(carta => {
            carta.classList.remove("volteada", "encontrada", "es-pieza", "piezando", "brillando", "destello", "error-animado");
            carta.disabled = false;
            carta.setAttribute("aria-pressed", "false");
            carta.style.zIndex = "";
        });
        mezclarCartas();
        actualizarContadores();
        void tablero.offsetWidth;
        tablero.classList.remove("sin-transicion");
    }

    async function iniciarPartida() {
        reiniciarEstado();
        const id = idPartida;
        await ejecutar(async () => {
            fase = "memorizar";

            // 1) Todas las imágenes a la vista (ya boca arriba) con entrada animada.
            tablero.classList.add("sin-transicion");
            cartas.forEach(carta => {
                carta.classList.add("volteada");
                carta.setAttribute("aria-pressed", "true");
            });
            void tablero.offsetWidth;
            tablero.classList.remove("sin-transicion");

            const ordenVisual = Array.from(tablero.children);
            ordenVisual.forEach((carta, i) => {
                carta.animate([
                    { opacity: 0, transform: "translateY(-90px) rotate(-10deg) scale(.5)" },
                    { opacity: 1, transform: "none" }
                ], { duration: 600, delay: i * 80, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
                efecto("tic", i * 80 + 250);
            });
            await esperar(ordenVisual.length * 80 + 650, id);

            for (let s = SEGUNDOS_MEMORIZAR; s > 0; s--) {
                mensajeMomentaneo(`¡Memorizá las imágenes! ${s}`);
                await esperar(1000, id);
            }

            // 2) Se dan vuelta todas, una detrás de otra.
            mensajeMomentaneo("¡Se dan vuelta!");
            ordenVisual.forEach((carta, i) => {
                setTimeout(() => {
                    if (id !== idPartida) return;
                    carta.classList.remove("volteada");
                    carta.setAttribute("aria-pressed", "false");
                    efecto("voltear");
                }, i * 70);
            });
            await esperar(ordenVisual.length * 70 + T_GIRO + 250, id);

            // 3) Se mezclan.
            fase = "mezclando";
            mensajeMomentaneo("¡Mezclando las cartas!");
            await mezclarConAnimacion(id);

            fase = "jugando";
            bloqueado = false;
            mensajeMomentaneo("¡A jugar! Encontrá las seis parejas.");
        });
    }

    async function mezclarConAnimacion(id) {
        const caja = tablero.getBoundingClientRect();
        const centroX = caja.left + caja.width / 2;
        const centroY = caja.top + caja.height / 2;
        const anchoCarta = cartas[0].offsetWidth;
        const mazo = new Map();

        // a) Las cartas viajan al centro y forman un mazo.
        efecto("barajar");
        Array.from(tablero.children).forEach((carta, i) => {
            const r = carta.getBoundingClientRect();
            const dx = centroX - (r.left + r.width / 2) + rnd(-6, 6);
            const dy = centroY - (r.top + r.height / 2) + rnd(-6, 6);
            const rot = rnd(-12, 12);
            mazo.set(carta, { dx, dy, rot });
            carta.style.zIndex = String(i + 1);
            carta.animate([
                { transform: "none" },
                { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.92)` }
            ], { duration: 650, delay: i * 35, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" });
        });
        await esperar(650 + cartas.length * 35 + 60, id);

        // b) Se baraja el mazo: se abre a los costados y se cruza.
        for (let ronda = 0; ronda < 3; ronda++) {
            efecto("barajar");
            Array.from(tablero.children).forEach((carta, i) => {
                const m = mazo.get(carta);
                const lado = (i + ronda) % 2 ? 1 : -1;
                const pila = `translate(${m.dx}px,${m.dy}px) rotate(${m.rot}deg) scale(.92)`;
                const abierta = `translate(${m.dx + lado * anchoCarta * 0.95}px,${m.dy + rnd(-12, 12)}px) rotate(${lado * rnd(8, 16)}deg) scale(.95)`;
                carta.animate([
                    { transform: pila },
                    { transform: abierta, offset: 0.5 },
                    { transform: pila }
                ], { duration: 480, delay: (i % 6) * 25, easing: "ease-in-out", fill: "forwards" });
            });
            await esperar(640, id);
        }

        // c) Se reparten en su nuevo orden.
        cartas.forEach(carta => carta.getAnimations().forEach(a => a.cancel()));
        mezclarCartas();
        const nuevas = Array.from(tablero.children);
        nuevas.forEach((carta, i) => {
            const r = carta.getBoundingClientRect();
            const m = mazo.get(carta);
            const dx = centroX - (r.left + r.width / 2);
            const dy = centroY - (r.top + r.height / 2);
            carta.animate([
                { transform: `translate(${dx}px,${dy}px) rotate(${m.rot}deg) scale(.92)` },
                { transform: "none" }
            ], { duration: 650, delay: i * 75, easing: "cubic-bezier(.2,.9,.3,1.15)", fill: "backwards" });
            efecto("tic", i * 75 + 450);
            setTimeout(() => { carta.style.zIndex = ""; }, i * 75 + 700);
        });
        await esperar(650 + nuevas.length * 75 + 120, id);
    }

    /* =====================================================
       JUGADAS
    ===================================================== */
    function mostrarCarta(carta) {
        efecto("voltear");
        carta.classList.add("volteada");
        carta.setAttribute("aria-pressed", "true");
    }

    function ocultarCarta(carta) {
        carta.classList.remove("volteada");
        carta.setAttribute("aria-pressed", "false");
    }

    function seleccionarCarta(carta) {
        if (
            bloqueado ||
            fase !== "jugando" ||
            partidaTerminada ||
            historiaPendiente ||
            carta.disabled ||
            carta.classList.contains("encontrada") ||
            carta.classList.contains("volteada")
        ) {
            return;
        }

        mostrarCarta(carta);

        if (!primeraCarta) {
            primeraCarta = carta;
            return;
        }

        segundaCarta = carta;
        bloqueado = true;
        movimientos++;
        actualizarContadores(true);
        ejecutar(() => resolverJugada(idPartida));
    }

    async function resolverJugada(id) {
        const cartaUno = primeraCarta;
        const cartaDos = segundaCarta;

        // Se espera a que la segunda carta termine de girar: las dos imágenes se ven completas.
        await esperar(T_GIRO + 150, id);

        if (cartaUno.dataset.id === cartaDos.dataset.id) {
            racha++;
            parejasEncontradas++;
            actualizarContadores(true);
            historiaPendiente = [cartaUno, cartaDos];
            primeraCarta = null;
            segundaCarta = null;

            efecto("acierto");
            efecto("brillo", 200);
            lanzarConfeti(racha > 1 ? 34 : 22);
            mensajeMomentaneo(racha > 1 ? `¡${racha} parejas seguidas! ¡Excelente!` : "¡Muy bien! ¡Encontraste una pareja!");
            [cartaUno, cartaDos].forEach(c => {
                c.classList.add("brillando");
                chispasDeCarta(c);
            });

            // La animación de brillo se completa entera antes de abrir la historia.
            await esperar(T_BRILLO, id);
            mostrarHistoria(cartaUno.dataset.id);
            bloqueado = false;
            return;
        }

        racha = 0;
        efecto("error");
        cartaUno.classList.add("error-animado");
        cartaDos.classList.add("error-animado");
        await esperar(780, id);
        cartaUno.classList.remove("error-animado");
        cartaDos.classList.remove("error-animado");
        ocultarCarta(cartaUno);
        ocultarCarta(cartaDos);
        efecto("voltear");
        await esperar(T_GIRO, id);

        primeraCarta = null;
        segundaCarta = null;
        bloqueado = false;
        comprobarLimite();
    }

    function mostrarHistoria(id) {
        const historia = historias[id];

        if (!historia) {
            convertirParejaEnRompecabezas();
            return;
        }

        tituloHistoria.textContent = historia.titulo;
        imagenHistoria.src = fotoResuelta[id] || "";
        imagenHistoria.alt = historia.titulo;
        contenidoHistoria.innerHTML = historia.texto +
            (historia.fuente ? `<p class="fuente-historia">Fuente: ${historia.fuente}</p>` : "");

        if (typeof modalHistoria.showModal === "function") {
            modalHistoria.showModal();
        } else {
            modalHistoria.setAttribute("open", "");
        }
    }

    function cerrarHistoria() {
        if (modalHistoria.open && typeof modalHistoria.close === "function") {
            modalHistoria.close();
        } else {
            modalHistoria.removeAttribute("open");
        }
        convertirParejaEnRompecabezas();
    }

    // Después de leer la historia, la pareja se transforma en su pieza del rompecabezas.
    function convertirParejaEnRompecabezas() {
        if (!historiaPendiente) return;

        const pareja = historiaPendiente;
        historiaPendiente = null;
        const id = idPartida;
        bloqueado = true;

        pareja.forEach(carta => {
            carta.classList.remove("brillando");
            carta.classList.add("encontrada", "es-pieza", "piezando");
            carta.disabled = true;
            carta.setAttribute("aria-pressed", "true");
            const foto = carta.querySelector("img");
            if (foto) foto.alt = "Pieza descubierta del rompecabezas";
        });
        efecto("encaja");

        ejecutar(async () => {
            await esperar(950, id);
            pareja.forEach(carta => carta.classList.remove("piezando"));
            if (parejasEncontradas === TOTAL_PAREJAS) {
                await terminarJuego(id);
            } else {
                bloqueado = false;
                comprobarLimite();
            }
        });
    }

    /* =====================================================
       FINAL: se arma el rompecabezas y estalla la fiesta
    ===================================================== */
    async function ensamblarRompecabezas(id) {
        const antes = new Map(cartas.map(c => [c, c.getBoundingClientRect()]));
        cartas
            .slice()
            .sort((a, b) => Number(a.dataset.posicionFinal) - Number(b.dataset.posicionFinal))
            .forEach(c => tablero.appendChild(c));

        cartas.forEach(carta => {
            const a = antes.get(carta);
            const d = carta.getBoundingClientRect();
            const dx = a.left - d.left;
            const dy = a.top - d.top;
            if (!dx && !dy) return;
            carta.style.zIndex = "5";
            carta.animate([
                { transform: `translate(${dx}px,${dy}px) rotate(${rnd(-14, 14)}deg) scale(1.08)` },
                { transform: "none" }
            ], { duration: 950, delay: rnd(0, 250), easing: "cubic-bezier(.3,1.2,.4,1)", fill: "backwards" });
            efecto("tic", rnd(300, 1100));
        });
        await esperar(1350, id);
        cartas.forEach(c => { c.style.zIndex = ""; });

        tablero.classList.add("ensamblado");
        efecto("encaja");
        await esperar(800, id);

        cartas.forEach(carta => {
            carta.style.setProperty("--demora", `${(Number(carta.dataset.posicionFinal) % COLUMNAS) * 110}ms`);
            carta.classList.add("destello");
        });
        efecto("brillo");
        await esperar(1500, id);
    }

    async function terminarJuego(id) {
        partidaTerminada = true;
        fase = "final";
        mensajeLimite.hidden = true;
        mensajeMomentaneo("¡Armaste el rompecabezas!");
        await ensamblarRompecabezas(id);
        mostrarFinal();
    }

    function mostrarFinal() {
        movimientosFinal.textContent = movimientos;

        // El título salta letra por letra.
        const texto = "¡Felicitaciones!";
        tituloFinal.textContent = "";
        tituloFinal.setAttribute("aria-label", texto);
        Array.from(texto).forEach((letra, i) => {
            const span = document.createElement("span");
            span.className = "letra";
            span.setAttribute("aria-hidden", "true");
            span.style.setProperty("--i", i);
            span.textContent = letra;
            tituloFinal.appendChild(span);
        });

        mensajeFinal.hidden = false;
        document.body.classList.add("final-abierto");
        mensajeFinal.scrollTop = 0;
        efecto("fanfarria");
        Fiesta.iniciar();
        botonJugarDeNuevo.focus({ preventScroll: true });
    }

    /* =====================================================
       PORTADA → PARTIDA
    ===================================================== */
    function comenzarPartida() {
        if (fase !== "portada") return;
        fase = "transicion";
        // El clic del usuario habilita el audio en los navegadores modernos.
        Sonido.iniciar();
        botonSonido.hidden = false;

        pantallaInicio.classList.add("portada-cayendo");
        const duracion = romperFotos();

        setTimeout(() => {
            pantallaInicio.hidden = true;
            document.body.classList.add("jugando");
            iniciarPartida();
        }, Math.max(duracion, 1500));
    }

    function reiniciarJuego() {
        if (fase === "portada" || fase === "transicion") return;
        iniciarPartida();
    }

    /* =====================================================
       EVENTOS
    ===================================================== */
    botonEmpezar.addEventListener("click", comenzarPartida);

    cartas.forEach(carta => {
        carta.addEventListener("click", () => seleccionarCarta(carta));
    });

    botonCerrarHistoria.addEventListener("click", cerrarHistoria);
    botonContinuar.addEventListener("click", cerrarHistoria);

    // Si se cierra con Escape, la pareja igualmente se transforma en pieza.
    modalHistoria.addEventListener("close", () => {
        if (historiaPendiente) convertirParejaEnRompecabezas();
    });

    botonReiniciar.addEventListener("click", reiniciarJuego);
    botonJugarDeNuevo.addEventListener("click", reiniciarJuego);
    botonReintentarLimite.addEventListener("click", reiniciarJuego);

    botonSonido.addEventListener("click", () => {
        const mudo = Sonido.alternarSilencio();
        botonSonido.textContent = mudo ? "🔇" : "🔊";
        botonSonido.setAttribute("aria-pressed", String(mudo));
        botonSonido.setAttribute("aria-label", mudo ? "Activar la música" : "Silenciar la música");
    });

    document.addEventListener("visibilitychange", () => Sonido.pausar(document.hidden));

    prepararTablero();
    mezclarCartas();
    actualizarContadores();
    fotosListas.then(aplicarFotos);
});
