# SARMIENTO MEMORIES

## Cómo usarlo
1. Descomprimí el archivo ZIP.
2. Abrí `index.html` en un navegador actualizado.
3. En la portada, pulsá **Empezar a jugar**. Ese primer clic inicia la música y hace que las fotografías que rodean la imagen principal **se rompan en pedacitos y caigan**.
4. Conservá la carpeta `imagenes` junto a `index.html`, `style.css` y `script.js`.

## Cómo es una partida
1. **Se muestran todas las imágenes** (cuenta regresiva de 4 segundos para memorizar).
2. Las cartas **se dan vuelta** una por una.
3. Las cartas **se juntan en un mazo, se barajan y se reparten** en un nuevo orden.
4. Las cartas son **en 3D** y giran al tocarlas.
5. Al elegir las dos cartas, las dos terminan de girar completas. Si es pareja, **brillan** (aura dorada, destello y estrellitas) y recién después se abre la historia. Si no, se sacuden y se vuelven a dar vuelta.
6. Al descubrir la pareja se convierte en una pieza del rompecabezas. Con las seis parejas, **las piezas vuelan a su lugar** y arman la imagen.
7. Pantalla final de **¡Felicitaciones!** con **fuegos artificiales, serpentinas y papelitos**.

## Fotos del juego (carpeta `imagenes`)
El juego busca estas fotos con estos nombres (acepta .jfif, .jpg, .jpeg, .png, .webp):
- `museo.jfif` · `bonaerense.png` · `elisa.jfif` · `cine.jfif` · `balneario.jfif` · `sbnMartin.jfif` (la plaza)
- `sarmiento.jfif`: la imagen que se arma en el rompecabezas y se ve grande al ganar.

Si una foto nueva no está, el juego usa la anterior como respaldo. Una vez que pongas las nuevas, podés borrar las viejas
(`monumento.jpg`, `capitansarmiento2.jpg`, etc.).

Las historias están en `script.js` (objeto `historias`), con su fuente. Son las mismas del juego "Atrapá los recuerdos".

## Música
Hay una canción alegre que suena durante todo el juego, con efectos de sonido. Abajo a la derecha hay un botón 🔊 para silenciarla. Para sacar ese botón, borrá la línea `control-sonido` de `index.html`.

## Archivos
- `index.html`: estructura, portada y textos del juego.
- `style.css`: diseño, cartas 3D, animaciones y adaptación a celulares.
- `script.js`: lógica del juego, música y efectos (Web Audio), rotura de fotos, barajado, fuegos artificiales y serpentinas.
- `imagenes/`: fotografías JPG originales.

La música se genera desde JavaScript, por lo que no hace falta agregar archivos de audio. Los navegadores no permiten iniciar sonido antes de una interacción; por eso empieza al tocar **Empezar a jugar**.

## Ajustes rápidos (arriba de `script.js`)
- `SEGUNDOS_MEMORIZAR`: cuánto tiempo se ven todas las imágenes al empezar.
- `MAX_MOVIMIENTOS`: límite de movimientos.
- `BPM` (dentro de `Sonido`): velocidad de la música.
