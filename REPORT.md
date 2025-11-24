# Informe de Load Test (Paso 5)

Este documento debe completarse después de ejecutar `npm run loadtest`.

## 1. Configuración de la prueba
- Endpoint probado: `https://functionprojectfibonacc-cjdda3bra9bydhaz.eastus-01.azurewebsites.net/api/Fibonacci` (POST)
- Valor enviado en el cuerpo: `nth = 35`
- Concurrencia: 10 ejecuciones paralelas
- Herramienta: Newman + script personalizado (`loadtest/newman-load.js`)

## 2. Resultados agregados (desde `loadtest/reports/aggregate.json`)
- Duración total (ms): **8,338 ms** (~8.3 segundos)
- Total de requests: **10**
- Fallos: **0** (100% de éxito)
- Tiempo de respuesta promedio (ms): **986.6 ms**

### Detalle de tiempos de respuesta individuales:
- Mínimo: 730 ms
- Máximo: 1,630 ms
- Rango: 730-1630 ms (distribución: 730, 881, 882, 885, 904, 910, 912, 915, 1217, 1630)

## 3. Observaciones

### Variabilidad de latencia:
- Las primeras respuestas fueron más rápidas (730-915 ms), mientras que las últimas dos fueron significativamente más lentas (1217 ms y 1630 ms).
- Esto sugiere que **no hubo cold start** aparente, ya que la primera request (730 ms) fue la más rápida.
- La variación de ~900 ms entre la request más rápida y la más lenta indica posible contención de recursos o escalado automático en progreso.

### Comportamiento de escalado:
- Azure Functions en plan Consumption manejó las 10 requests concurrentes sin fallos.
- El incremento en latencia hacia el final sugiere que el sistema puede estar alcanzando límites de la instancia única o iniciando el escalado.
- No se observó throttling (código 429) ni errores de timeout.

### Consistencia:
- 8 de las 10 requests tuvieron tiempos de respuesta agrupados entre 730-915 ms (rango de ~185 ms).
- Las 2 requests restantes (1217 ms y 1630 ms) representan outliers que elevan el promedio.

## 4. Conclusiones sobre escalabilidad

### Capacidad actual:
- La función manejó exitosamente 10 requests concurrentes con Fibonacci(35), un cálculo computacionalmente moderado.
- El tiempo promedio de ~987 ms es aceptable para este tipo de operación.
- La tasa de éxito del 100% indica estabilidad básica.

### Limitaciones observadas:
- La variabilidad en tiempos de respuesta (más del doble entre min y max) sugiere que una sola instancia puede estar saturándose.
- El plan Consumption puede estar limitado en recursos CPU/memoria para mantener latencias consistentes bajo carga concurrente.

### Recomendaciones:
- Para cargas más altas, considerar **Premium Plan** para eliminar cold starts y garantizar instancias precalentadas.
- Implementar **Application Insights** para monitorear métricas detalladas de CPU, memoria y escalado de instancias.
- La función escalaría mejor con optimizaciones de código (ej: memoization con Redis/Cosmos DB para persistencia entre instancias).

## 5. Próximos pasos sugeridos
- Probar con valores de `nth` más altos para stress CPU.
- Aumentar concurrencia (20, 50) y comparar.
- Incorporar monitorización (Application Insights) para métricas más finas.
