# Patrones de Componentes - Guía para AI

## 🎯 Objetivo

Este archivo establece los patrones y ejemplos concretos que DEBES seguir al crear o maquetar componentes.

## 📝 Patrón Base de Componente

### Estructura TypeScript

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importar SOLO los módulos PrimeNG necesarios
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-nombre-componente',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    CardModule
  ],
  templateUrl: './nombre-componente.html',
  styleUrl: './nombre-componente.scss'
})
export class NombreComponente {
  // Lógica del componente
}
```

## 🎨 Patrones de Maquetación

### Formulario Básico

```html
<p-card header="Título del Formulario">
  <form class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium">Campo</label>
      <input type="text" pInputText placeholder="Ingresa texto" />
    </div>
    
    <div class="flex gap-2 justify-end">
      <p-button label="Cancelar" severity="secondary" />
      <p-button label="Guardar" icon="pi pi-save" />
    </div>
  </form>
</p-card>
```

### Tabla de Datos

```html
<p-card>
  <p-table [value]="datos" [paginator]="true" [rows]="10">
    <ng-template pTemplate="header">
      <tr>
        <th>Columna 1</th>
        <th>Columna 2</th>
        <th>Acciones</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-item>
      <tr>
        <td>{{ item.col1 }}</td>
        <td>{{ item.col2 }}</td>
        <td>
          <p-button 
            icon="pi pi-pencil" 
            severity="info"
            [text]="true" />
          <p-button 
            icon="pi pi-trash" 
            severity="danger"
            [text]="true" />
        </td>
      </tr>
    </ng-template>
  </p-table>
</p-card>
```

**Módulos necesarios:**
```typescript
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
```

### Diálogo Modal

```html
<p-dialog 
  header="Título del Diálogo" 
  [(visible)]="mostrarDialog"
  [modal]="true"
  [style]="{width: '50vw'}"
  [draggable]="false">
  
  <p>Contenido del diálogo</p>
  
  <ng-template pTemplate="footer">
    <p-button 
      label="Cancelar" 
      severity="secondary"
      (onClick)="mostrarDialog = false" />
    <p-button 
      label="Confirmar" 
      (onClick)="confirmar()" />
  </ng-template>
</p-dialog>
```

**Módulos necesarios:**
```typescript
import { DialogModule } from 'primeng/dialog';
```

### Formulario con Validación

```html
<form [formGroup]="miFormulario" (ngSubmit)="onSubmit()">
  <div class="flex flex-col gap-2">
    <label>Email</label>
    <input 
      type="email" 
      pInputText 
      formControlName="email"
      [class.ng-invalid]="miFormulario.get('email')?.invalid && miFormulario.get('email')?.touched" />
    @if (miFormulario.get('email')?.invalid && miFormulario.get('email')?.touched) {
      <small class="text-red-600">Email inválido</small>
    }
  </div>
  
  <p-button 
    type="submit"
    label="Enviar"
    [disabled]="miFormulario.invalid" />
</form>
```

**Módulos necesarios:**
```typescript
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
```

### Layout con Sidebar

```html
<div class="flex h-screen">
  <!-- Sidebar -->
  <p-sidebar 
    [(visible)]="sidebarVisible"
    [position]="'left'"
    [modal]="false">
    <h3>Menú</h3>
    <!-- Contenido del menú -->
  </p-sidebar>
  
  <!-- Contenido principal -->
  <div class="flex-1 p-4">
    <p-button 
      icon="pi pi-bars"
      (onClick)="sidebarVisible = true" />
    <!-- Contenido -->
  </div>
</div>
```

**Módulos necesarios:**
```typescript
import { SidebarModule } from 'primeng/sidebar';
```

## 🎯 Reglas de Espaciado (Tailwind)

Siempre usar clases de Tailwind para espaciado:

- **Padding**: `p-2`, `p-4`, `p-6`, `p-8`
- **Margin**: `m-2`, `m-4`, `m-6`, `m-8`
- **Gap**: `gap-2`, `gap-4`, `gap-6` (en flex/grid)
- **Width**: `w-full`, `w-1/2`, `max-w-md`, `max-w-lg`
- **Flex**: `flex`, `flex-col`, `flex-row`, `justify-between`, `items-center`

## 🎨 Colores (Tailwind + PrimeNG)

- **Primario**: Usar `severity` de PrimeNG o `bg-blue-600`
- **Secundario**: `severity="secondary"` o `bg-gray-600`
- **Éxito**: `severity="success"` o `bg-green-600`
- **Error**: `severity="danger"` o `bg-red-600`
- **Advertencia**: `severity="warn"` o `bg-yellow-600`
- **Info**: `severity="info"` o `bg-blue-400`

## 📱 Responsive (Tailwind)

Siempre considerar responsive:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Contenido -->
</div>
```

## ✅ Checklist de Implementación

Al crear cualquier componente, verificar:

- [ ] ¿Estoy usando PrimeNG para todos los componentes UI?
- [ ] ¿He importado solo los módulos necesarios?
- [ ] ¿Estoy usando Tailwind para layout y espaciado?
- [ ] ¿Los iconos son de PrimeIcons (pi pi-*)?
- [ ] ¿El componente es responsive?
- [ ] ¿He seguido los patrones establecidos?

