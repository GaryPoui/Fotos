# Fixtures

- cielo.png: imagen sintética de pruebas del proyecto.
- cielo.heic: patrón de color `rainbow-451x461.heic` de strukturag/libheif,
  https://github.com/strukturag/libheif/blob/master/tests/data/rainbow-451x461.heic,
  recuperado 2026-10-08, bajo licencia LGPL-3.0 del proyecto. Sólo pruebas, no recuerdos demo.

## Metadata fixture
`cielo-timestamp.jpg` derives from the synthetic cielo.png using sharp.withExif. It contains DateTimeOriginal 2021:02:14 23:58:07 and OffsetTimeOriginal -03:00; no personal image or GPS. Calendar browser tests replace the fixed ASCII date with their test calendar day.
