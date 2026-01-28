# Shared - Componentes y Utilidades Compartidas

## 📁 Estructura

```
shared/
├── components/     # Componentes reutilizables
├── services/       # Servicios compartidos
├── models/         # Interfaces y tipos
└── utils/          # Funciones utilitarias
```

## 🎯 Reglas de Desarrollo

### Componentes (`shared/components/`)

1. **Reutilización**: Los componentes deben ser genéricos y reutilizables
2. **PrimeNG First**: Usar componentes de PrimeNG cuando sea posible
3. **Composición**: Crear componentes compuestos cuando sea necesario
4. **Props claras**: Interfaces bien definidas para inputs/outputs
5. **Documentación**: Cada componente debe tener comentarios JSDoc

### Servicios (`shared/services/`)

1. **Single Responsibility**: Un servicio, una responsabilidad
2. **Injectable Root**: `providedIn: 'root'` para servicios compartidos
3. **Error Handling**: Manejo consistente de errores
4. **Observables**: Usar RxJS para operaciones asíncronas

### Modelos (`shared/models/`)

1. **Interfaces claras**: Definir interfaces para todos los datos
2. **Tipos estrictos**: Evitar `any`, usar tipos específicos
3. **Validación**: Considerar validación de datos cuando sea necesario

### Utilidades (`shared/utils/`)

1. **Funciones puras**: Preferir funciones puras cuando sea posible
2. **Sin efectos secundarios**: Las utilidades no deben modificar estado global
3. **Testing**: Todas las utilidades deben ser testeables

## 🔧 Buenas Prácticas

- ✅ Usar PrimeNG para componentes UI
- ✅ Mantener componentes pequeños y enfocados
- ✅ Documentar código complejo
- ✅ Seguir convenciones de nombres de Angular
- ✅ Evitar lógica de negocio en componentes
- ✅ Usar TypeScript estricto

