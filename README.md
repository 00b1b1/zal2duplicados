# Duplicados ZAL Seco

Herramienta local para preparar pedidos duplicados de recepciones DHL / Carrefour ZAL Seco. El Excel se analiza en un Web Worker dentro del navegador. No se envía a un servidor.

## Uso

1. Carga un XLSX, XLS o XLSM. Las hojas de jornada deben tener `PEDIDO` en B4 y `PROVEEDOR` en C4; los pedidos comienzan en la fila 5.
2. Elige la jornada y revisa sus pedidos. La búsqueda filtra la tabla, pero no altera el PDF ni el guardado.
3. Genera el PDF de la jornada: una página A4 apaisada por pedido. También puedes preparar un pedido individual.
4. Indica quién realiza el procesamiento y guarda la jornada. Solo se guardan sus pedidos en el almacenamiento local del navegador. El historial permite volver a generar el PDF y confirmar el borrado.

Los registros del formato anterior se separan automáticamente por día al abrir el historial. Se conservan hasta 30 jornadas. Si se borran los datos del navegador, también desaparece el historial.

## Desarrollo

```bash
npm install
npm run lint
npm run build
npm run dev
```

El proyecto utiliza Vite, React, TypeScript, Tailwind, XLSX, jsPDF y localforage. La base de producción es `/zal2duplicados/`, con despliegue automático a GitHub Pages desde `main` mediante `.github/workflows/deploy-pages.yml`.

## Marca

Los SVG corporativos en `public/brand/` se obtuvieron del encabezado del [DHL Brand Hub](https://www.brandhub.dhl/en). El favicon emplea el DHL Icon de color para tamaños reducidos; el encabezado y el PDF emplean el logotipo estándar. Consulta `public/brand/README.md` para procedencia y colores.
