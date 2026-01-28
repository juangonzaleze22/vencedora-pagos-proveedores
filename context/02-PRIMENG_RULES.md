# Reglas de PrimeNG - Contexto para AI

## 🎯 REGLA PRINCIPAL (SIEMPRE APLICAR)

**TODOS los componentes UI DEBEN usar PrimeNG cuando sea posible.**

Cuando el usuario pida crear, maquetar o modificar componentes, SIEMPRE:
1. ✅ Buscar primero si PrimeNG tiene un componente que cumpla la necesidad
2. ✅ Usar componentes de PrimeNG en lugar de HTML nativo
3. ✅ Importar solo los módulos específicos necesarios
4. ✅ Personalizar con Tailwind CSS cuando sea necesario

## 📦 Componentes PrimeNG por Tipo

### Formularios - SIEMPRE usar PrimeNG

**NO usar:**
```html
<input type="text" />
<input type="password" />
<input type="email" />
<select></select>
<textarea></textarea>
```

**SÍ usar:**
```html
<input type="text" pInputText />
<p-password />
<input type="email" pInputText />
<p-dropdown />
<p-textarea />
```

**Módulos a importar:**
```typescript
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
```

### Botones - SIEMPRE usar PrimeNG

**NO usar:**
```html
<button>Click</button>
```

**SÍ usar:**
```html
<p-button label="Click" icon="pi pi-check" />
```

**Módulo a importar:**
```typescript
import { ButtonModule } from 'primeng/button';
```

### Contenedores - SIEMPRE usar PrimeNG

**NO usar:**
```html
<div class="card">...</div>
```

**SÍ usar:**
```html
<p-card header="Título">...</p-card>
```

**Módulo a importar:**
```typescript
import { CardModule } from 'primeng/card';
```

### Tablas - SIEMPRE usar PrimeNG

**NO usar:**
```html
<table>...</table>
```

**SÍ usar:**
```html
<p-table [value]="data">...</p-table>
```

**Módulo a importar:**
```typescript
import { TableModule } from 'primeng/table';
```

### Diálogos/Modales - SIEMPRE usar PrimeNG

**NO usar:**
```html
<div class="modal">...</div>
```

**SÍ usar:**
```html
<p-dialog header="Título" [(visible)]="showDialog">...</p-dialog>
```

**Módulo a importar:**
```typescript
import { DialogModule } from 'primeng/dialog';
```

### Notificaciones - SIEMPRE usar PrimeNG

**NO usar:**
```html
<div class="alert">...</div>
```

**SÍ usar:**
```html
<p-toast />
<!-- Y usar MessageService en el componente -->
```

**Módulos a importar:**
```typescript
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
```

## 🔧 Patrón de Implementación

### 1. Estructura del Componente

```typescript
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-mi-componente',
  imports: [
    ButtonModule,
    InputTextModule,
    CardModule
  ],
  templateUrl: './mi-componente.html',
  styleUrl: './mi-componente.scss'
})
export class MiComponente {
  // ...
}
```

### 2. Template con PrimeNG

```html
<p-card header="Título">
  <div class="flex flex-col gap-4">
    <input type="text" pInputText placeholder="Nombre" />
    <p-button label="Guardar" icon="pi pi-save" />
  </div>
</p-card>
```

### 3. Personalización con Tailwind

```html
<p-button 
  label="Guardar" 
  styleClass="w-full bg-blue-600"
  [class.mt-4]="true" />
```

## 📋 Checklist OBLIGATORIO

Antes de crear cualquier componente UI, verificar:

- [ ] ¿Existe un componente PrimeNG equivalente?
- [ ] ¿He importado el módulo de PrimeNG necesario?
- [ ] ¿Estoy usando las directivas correctas (pInputText, etc.)?
- [ ] ¿He agregado el módulo al array `imports` del componente?
- [ ] ¿Estoy usando Tailwind para espaciado y layout?

## 🚫 NO HACER

- ❌ Crear inputs HTML nativos cuando existe p-inputText
- ❌ Crear botones HTML nativos cuando existe p-button
- ❌ Crear tablas HTML nativas cuando existe p-table
- ❌ Crear modales personalizados cuando existe p-dialog
- ❌ Importar módulos completos de PrimeNG (solo los necesarios)

## ✅ SÍ HACER

- ✅ Usar PrimeNG para TODOS los componentes UI
- ✅ Importar solo módulos específicos
- ✅ Combinar PrimeNG con Tailwind para estilos
- ✅ Usar iconos de PrimeIcons (pi pi-*)
- ✅ Seguir la documentación de PrimeNG

## 🎨 Iconos

Siempre usar iconos de PrimeIcons:
```html
<p-button icon="pi pi-save" />
<p-button icon="pi pi-check" />
<p-button icon="pi pi-times" />
<p-button icon="pi pi-user" />
```

Referencia: https://primeng.org/icons

## 📚 Recursos

- Documentación: https://primeng.org/
- Ejemplos: https://primeng.org/showcase/
- Iconos: https://primeng.org/icons

## 🔄 Cuando NO existe en PrimeNG

Solo si PrimeNG NO tiene un componente equivalente:
1. Crear componente personalizado en `shared/components/`
2. Usar PrimeNG internamente si es posible
3. Documentar por qué no se usa PrimeNG

