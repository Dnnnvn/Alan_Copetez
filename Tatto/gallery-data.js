/* ==========================================================================
   GALERÍA · Alan Copetez
   --------------------------------------------------------------------------
   PARA AGREGAR UNA FOTO NUEVA:
     1. Copia la imagen a la carpeta ./img  (ej. img/Ttto10.png)
     2. Añade un bloque al final de GALLERY con su ruta, categorías y texto.
     3. Guarda. ¡Listo! Aparece en el mosaico, el carrusel y el lightbox.

   Campos de cada pieza:
     src   → ruta de la imagen
     w, h  → ancho y alto en píxeles (opcional pero recomendado: evita saltos
             de diseño mientras carga). Clic derecho > Propiedades en Windows.
     alt   → descripción de la imagen (accesibilidad + lightbox)
     cat   → una o más claves de CATEGORIES, separadas por espacio
     label → texto que se muestra al pasar el cursor (opcional)
     featured → false para excluirla de la cinta del carrusel y de la rotación
                del hero (opcional)
     hero  → true en la pieza con la que EMPIEZA la rotación del hero (opcional;
             si ninguna lo tiene, empieza por la primera)

   PARA AGREGAR UNA CATEGORÍA NUEVA: añádela en CATEGORIES y úsala en `cat`.
   El filtro se genera solo con las categorías que tengan piezas.
   ========================================================================== */

window.GALLERY_CATEGORIES = {
  bn:         "Negro y gris",
  color:      "Color",
  personajes: "Personajes",
  mangas:     "Mangas"
};

window.GALLERY = [
  { src: "img/Ttto1.png", w: 652, h: 688, cat: "bn personajes",    label: "Negro y gris · Realismo",
    alt: "Tatuaje realista en negro y gris de portada de periódico deportivo en el brazo" },

  { src: "img/Ttto3.png", w: 641, h: 662, cat: "color mangas",     label: "Manga · Color",
    alt: "Manga completa de samurái japonés a color" },

  { src: "img/Ttto2.png", w: 522, h: 444, cat: "bn",               label: "Negro y gris · Realismo",
    alt: "Tatuaje realista en negro y gris de Hércules con piel de león" },

  { src: "img/Ttto5.png", w: 667, h: 670, cat: "color",            label: "Espalda · Color",
    alt: "Espalda completa a color con calavera encapuchada, cuervo y castillo" },

  { src: "img/Ttto4.png", w: 516, h: 439, cat: "color personajes", label: "Retrato · Color",
    alt: "Retrato realista a color con bandera en la pierna" },

  { src: "img/Ttto7.png", w: 335, h: 677, cat: "color personajes", label: "Japonés · Color",
    alt: "Antebrazo con luchador de sumo en estilo japonés neotradicional a color" },

  { src: "img/Ttto9.png", w: 651, h: 680, cat: "bn mangas",        label: "Manga · Negro y gris", hero: true,
    alt: "Manga completa de samurái en negro y gris con máscara hannya" },

  { src: "img/Ttto6.png", w: 611, h: 431, cat: "color personajes", label: "Anime · Color",
    alt: "Tatuaje a color de Goku niño con Shenlong y la Kame House" },

  { src: "img/Ttto8.png", w: 513, h: 711, cat: "color personajes", label: "Personajes · Color",
    alt: "Antebrazo a color con la novia cadáver y un muñeco de jengibre" }

  // , { src: "img/Ttto10.png", w: 600, h: 800, cat: "bn", label: "Negro y gris", alt: "Descripción de la nueva pieza" }
];
