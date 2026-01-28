# Contextos - Arquitectura de la Aplicación

## 📁 Estructura de Carpetas

Esta carpeta contiene los **contextos** de la aplicación, que son servicios singleton que manejan el estado y la lógica de negocio de diferentes módulos.

## 🎯 Propósito

Los contextos sirven para:
- **Centralizar el estado** de la aplicación
- **Compartir lógica de negocio** entre componentes
- **Mantener la separación de responsabilidades**
- **Facilitar el testing** y mantenimiento
- **Establecer reglas y configuraciones** (ComponentContext)

## 📋 Archivos de Contexto

### `auth.context.ts`
Contexto de autenticación que maneja:
- Estado de autenticación del usuario
- Información del usuario actual
- Métodos de login/logout
- Verificación de roles

### `component-context.ts` ⭐ **NUEVO**
Contexto de configuración de componentes que establece:
- **PrimeNG como librería principal** de componentes UI
- Mapeo completo de componentes PrimeNG disponibles
- Reglas de uso y mejores prácticas
- Ejemplos de implementación
- Checklist para desarrollo de componentes

**IMPORTANTE**: Este archivo establece que **TODOS los componentes UI deben usar PrimeNG** cuando sea posible.

## 🎨 Reglas de Componentes (ComponentContext)

### REGLA PRINCIPAL
**Siempre usar PrimeNG primero** antes de crear componentes personalizados.

### Componentes Disponibles

#### Formularios
- Inputs: `p-inputText`, `p-inputNumber`, `p-password`, `p-textarea`
- Selectores: `p-dropdown`, `p-multiSelect`, `p-calendar`
- Checkboxes/Radios: `p-checkbox`, `p-radioButton`, `p-inputSwitch`

#### Botones
- `p-button` - Botón principal
- `p-splitButton` - Botón con menú
- `p-toggleButton` - Botón toggle

#### Contenedores
- `p-card` - Tarjetas
- `p-panel` - Paneles
- `p-accordion` - Acordeones
- `p-tabView` - Pestañas

#### Datos
- `p-table` - Tablas de datos
- `p-paginator` - Paginación
- `p-tree` - Árboles de datos

#### Overlays
- `p-dialog` - Diálogos modales
- `p-sidebar` - Barras laterales
- `p-toast` - Notificaciones toast
- `p-tooltip` - Tooltips

## 📝 Reglas de Uso

### 1. Un contexto por dominio funcional
Cada contexto debe representar un dominio específico de la aplicación:
- `auth.context.ts` - Autenticación y autorización
- `user.context.ts` - Gestión de usuarios
- `payment.context.ts` - Gestión de pagos
- `component-context.ts` - Configuración de componentes

### 2. Uso de Signals (Angular Signals)
Los contextos deben usar **Angular Signals** para el manejo reactivo del estado:

```typescript
export class AuthContext {
  private _isAuthenticated = signal<boolean>(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
}
```

### 3. Inyección de Dependencias
Los contextos deben ser **providedIn: 'root'** para ser singleton:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthContext { }
```

### 4. Métodos Públicos
- Los métodos deben ser claros y descriptivos
- Deben retornar observables o signals según corresponda
- Manejar errores de forma consistente

### 5. No exponer estado interno directamente
Siempre usar `asReadonly()` para signals que se exponen.

## 🔧 Uso de ComponentContext

### Verificar si existe un componente PrimeNG

```typescript
import { hasPrimeNGComponent } from './contexts/component-context';

if (hasPrimeNGComponent('button')) {
  // Usar p-button de PrimeNG
}
```

### Obtener nombre del componente

```typescript
import { getPrimeNGComponent } from './contexts/component-context';

const buttonComponent = getPrimeNGComponent('button', 'primary');
// Retorna: 'p-button'
```

### Consultar reglas

```typescript
import { ComponentContext } from './contexts/component-context';

// Verificar reglas
console.log(ComponentContext.rules.usePrimeNGFirst); // true
console.log(ComponentContext.components.button.primary); // 'p-button'
```

## 📚 Ejemplos

Ver los ejemplos en `component-context.ts` para:
- Implementación de botones
- Implementación de inputs
- Implementación de cards
- Implementación de tablas

## ✅ Checklist de Componentes

Antes de crear un componente, verificar:
- [ ] ¿Existe un componente PrimeNG que pueda usar?
- [ ] ¿He importado solo los módulos necesarios?
- [ ] ¿Estoy usando las clases de Tailwind para espaciado?
- [ ] ¿El componente sigue el design system establecido?
- [ ] ¿He documentado el componente si es complejo?

## 🔗 Recursos

- [Documentación PrimeNG](https://primeng.org/)
- [Iconos PrimeNG](https://primeng.org/icons)
- [Temas PrimeNG](https://primeng.org/theming)
- [Ejemplos PrimeNG](https://primeng.org/showcase/)
