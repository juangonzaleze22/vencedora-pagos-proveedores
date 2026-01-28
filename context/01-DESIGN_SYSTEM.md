# Design System - Vencedora Pagos Proveedores

## 🎨 Principios del Design System

### 1. PrimeNG como Base
- **PrimeNG** es nuestra librería de componentes principal
- Todos los componentes UI deben usar PrimeNG cuando sea posible
- Personalización mediante temas y estilos CSS cuando sea necesario

### 2. Tailwind CSS para Utilidades
- **Tailwind CSS** se usa para:
  - Espaciado y layout
  - Colores personalizados
  - Utilidades rápidas
  - Responsive design

### 3. Armonía Visual
- Mantener consistencia en:
  - Espaciado (usar sistema de espaciado de Tailwind)
  - Tipografía (definir escala de tipos)
  - Colores (usar paleta consistente)
  - Componentes (seguir patrones de PrimeNG)

## 📐 Estándares de Diseño

### Espaciado
Usar la escala de Tailwind:
- `p-2`, `p-4`, `p-6`, `p-8` para padding
- `m-2`, `m-4`, `m-6`, `m-8` para margin
- `gap-2`, `gap-4`, `gap-6` para gaps en flex/grid

### Colores
- **Primario**: Azul (blue-600, blue-700)
- **Secundario**: Gris (gray-600, gray-700)
- **Éxito**: Verde (green-600)
- **Error**: Rojo (red-600)
- **Advertencia**: Amarillo (yellow-600)
- **Info**: Azul claro (blue-400)

### Tipografía
- **Títulos**: `text-2xl`, `text-3xl`, `font-bold`
- **Subtítulos**: `text-xl`, `text-lg`, `font-semibold`
- **Cuerpo**: `text-base`, `text-sm`
- **Pequeño**: `text-xs`

### Componentes PrimeNG Comunes
- `p-button` - Botones
- `p-inputText` - Inputs de texto
- `p-password` - Inputs de contraseña
- `p-card` - Tarjetas
- `p-dialog` - Diálogos modales
- `p-table` - Tablas de datos
- `p-dropdown` - Selectores desplegables
- `p-calendar` - Selectores de fecha

## 🔄 Reutilización de Código

### Componentes Base
Crear componentes base que envuelvan PrimeNG cuando:
1. Se necesite personalización específica
2. Se requiera lógica común
3. Se quiera simplificar la API

Ejemplo:
```typescript
// shared/components/button/button.ts
@Component({
  selector: 'app-button',
  template: `
    <p-button 
      [label]="label"
      [icon]="icon"
      [styleClass]="styleClass"
      (onClick)="handleClick()">
    </p-button>
  `
})
export class AppButton {
  @Input() label!: string;
  @Input() icon?: string;
  @Input() styleClass?: string;
  @Output() clicked = new EventEmitter();
  
  handleClick() {
    this.clicked.emit();
  }
}
```

## 📋 Checklist de Componentes

Al crear un componente, verificar:
- [ ] ¿Existe un componente PrimeNG que pueda usar?
- [ ] ¿El componente es reutilizable?
- [ ] ¿Tiene interfaces claras para inputs/outputs?
- [ ] ¿Está documentado?
- [ ] ¿Sigue los estándares de espaciado y colores?
- [ ] ¿Es responsive?

## 🚀 Mejores Prácticas

1. **Composición sobre herencia**: Preferir componentes pequeños y composición
2. **Props claras**: Interfaces bien definidas
3. **Documentación**: Comentar código complejo
4. **Testing**: Componentes deben ser testeables
5. **Performance**: Usar OnPush change detection cuando sea posible
6. **Accesibilidad**: Seguir estándares WCAG

