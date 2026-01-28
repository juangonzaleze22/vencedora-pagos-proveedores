/**
 * Component Context - Reglas y Configuración de Componentes
 * 
 * Este contexto establece las reglas y estándares para el uso de componentes
 * en la aplicación. Define que PrimeNG es la librería de componentes principal
 * y establece las convenciones de uso.
 * 
 * @module ComponentContext
 */

/**
 * Configuración de Componentes UI
 * 
 * REGLA PRINCIPAL: Todos los componentes UI deben usar PrimeNG cuando sea posible.
 * 
 * Esta configuración establece:
 * - PrimeNG como librería de componentes principal
 * - Convenciones de uso para cada tipo de componente
 * - Mapeo de componentes comunes
 */
export const ComponentContext = {
  /**
   * Librería de componentes principal
   */
  library: 'PrimeNG' as const,

  /**
   * Versión de PrimeNG utilizada
   */
  version: '20.x',

  /**
   * Mapeo de componentes PrimeNG por tipo
   * 
   * Cuando necesites un componente, consulta este mapeo primero.
   * Si existe en PrimeNG, úsalo. Si no, crea un componente personalizado.
   */
  components: {
    // Formularios
    input: {
      text: 'p-inputText',
      number: 'p-inputNumber',
      password: 'p-password',
      textarea: 'p-textarea',
      email: 'p-inputText (type="email")',
      date: 'p-calendar',
      time: 'p-calendar (timeOnly)',
      select: 'p-dropdown',
      multiselect: 'p-multiSelect',
      checkbox: 'p-checkbox',
      radio: 'p-radioButton',
      switch: 'p-inputSwitch',
      file: 'p-fileUpload',
      rating: 'p-rating',
      slider: 'p-slider',
      color: 'p-colorPicker'
    },

    // Botones y Acciones
    button: {
      primary: 'p-button',
      icon: 'p-button (icon only)',
      split: 'p-splitButton',
      toggle: 'p-toggleButton'
    },

    // Contenedores
    container: {
      card: 'p-card',
      panel: 'p-panel',
      accordion: 'p-accordion',
      tabview: 'p-tabView',
      fieldset: 'p-fieldset',
      divider: 'p-divider'
    },

    // Datos
    data: {
      table: 'p-table',
      datatable: 'p-table (con paginación, filtros, etc.)',
      tree: 'p-tree',
      treetable: 'p-treeTable',
      dataview: 'p-dataView',
      paginator: 'p-paginator',
      virtualscroller: 'p-virtualScroller'
    },

    // Overlays
    overlay: {
      dialog: 'p-dialog',
      sidebar: 'p-sidebar',
      overlaypanel: 'p-overlayPanel',
      tooltip: 'p-tooltip',
      confirmdialog: 'p-confirmDialog',
      toast: 'p-toast'
    },

    // Menús
    menu: {
      menubar: 'p-menubar',
      breadcrumb: 'p-breadcrumb',
      contextmenu: 'p-contextMenu',
      dock: 'p-dock',
      megamenu: 'p-megaMenu',
      menu: 'p-menu',
      steps: 'p-steps',
      tabmenu: 'p-tabMenu',
      tieredmenu: 'p-tieredMenu'
    },

    // Mensajes y Notificaciones
    message: {
      message: 'p-message',
      toast: 'p-toast',
      inlinemessage: 'p-inlineMessage'
    },

    // Media
    media: {
      image: 'p-image',
      avatar: 'p-avatar',
      galleria: 'p-galleria',
      carousel: 'p-carousel'
    },

    // Misceláneos
    misc: {
      badge: 'p-badge',
      chip: 'p-chip',
      skeleton: 'p-skeleton',
      progressbar: 'p-progressBar',
      progressspinner: 'p-progressSpinner',
      tag: 'p-tag',
      terminal: 'p-terminal',
      blockui: 'p-blockUI',
      ripple: 'p-ripple'
    }
  },

  /**
   * Reglas de Uso
   */
  rules: {
    /**
     * REGLA 1: Siempre usar PrimeNG primero
     * 
     * Antes de crear un componente personalizado, verifica si PrimeNG
     * tiene un componente que cumpla con tus necesidades.
     */
    usePrimeNGFirst: true,

    /**
     * REGLA 2: Importar solo los módulos necesarios
     * 
     * No importar todo PrimeNG. Importar solo los módulos específicos
     * que necesites en cada componente.
     * 
     * @example
     * ```typescript
     * import { ButtonModule } from 'primeng/button';
     * import { InputTextModule } from 'primeng/inputtext';
     * ```
     */
    importSpecificModules: true,

    /**
     * REGLA 3: Personalización mediante CSS/Tailwind
     * 
     * Para personalizar componentes PrimeNG, usar:
     * - Clases de Tailwind para estilos rápidos
     * - CSS personalizado para estilos complejos
     * - Props de PrimeNG (styleClass, style, etc.)
     */
    customizeWithCSS: true,

    /**
     * REGLA 4: Componentes compuestos
     * 
     * Cuando necesites combinar múltiples componentes PrimeNG o
     * agregar lógica específica, crear un componente wrapper en
     * shared/components/ que use PrimeNG internamente.
     */
    createWrappersForComplexLogic: true,

    /**
     * REGLA 5: Consistencia visual
     * 
     * Mantener consistencia usando el mismo tema de PrimeNG
     * y las mismas clases de Tailwind para espaciado y colores.
     */
    maintainVisualConsistency: true
  },

  /**
   * Tema de PrimeNG
   */
  theme: {
    name: 'lara-light-blue',
    customizations: {
      // Personalizaciones del tema pueden ir aquí
      // Por ahora usamos el tema por defecto
    }
  },

  /**
   * Ejemplos de uso común
   */
  examples: {
    button: `
      // En el componente TypeScript
      import { ButtonModule } from 'primeng/button';
      
      @Component({
        imports: [ButtonModule],
        // ...
      })
      
      // En el template
      <p-button 
        label="Guardar" 
        icon="pi pi-save"
        (onClick)="save()">
      </p-button>
    `,

    input: `
      // En el componente TypeScript
      import { InputTextModule } from 'primeng/inputtext';
      
      @Component({
        imports: [InputTextModule],
        // ...
      })
      
      // En el template
      <input 
        type="text" 
        pInputText 
        [(ngModel)]="value"
        placeholder="Ingresa texto" />
    `,

    card: `
      // En el componente TypeScript
      import { CardModule } from 'primeng/card';
      
      @Component({
        imports: [CardModule],
        // ...
      })
      
      // En el template
      <p-card header="Título" subheader="Subtítulo">
        <p>Contenido de la tarjeta</p>
      </p-card>
    `,

    table: `
      // En el componente TypeScript
      import { TableModule } from 'primeng/table';
      
      @Component({
        imports: [TableModule],
        // ...
      })
      
      // En el template
      <p-table [value]="data">
        <ng-template pTemplate="header">
          <tr>
            <th>Columna 1</th>
            <th>Columna 2</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>{{ item.col1 }}</td>
            <td>{{ item.col2 }}</td>
          </tr>
        </ng-template>
      </p-table>
    `
  },

  /**
   * Checklist antes de crear un componente
   */
  checklist: [
    '¿Existe un componente PrimeNG que pueda usar?',
    '¿He importado solo los módulos necesarios?',
    '¿Estoy usando las clases de Tailwind para espaciado?',
    '¿El componente sigue el design system establecido?',
    '¿He documentado el componente si es complejo?'
  ],

  /**
   * Recursos útiles
   */
  resources: {
    documentation: 'https://primeng.org/',
    icons: 'https://primeng.org/icons',
    themes: 'https://primeng.org/theming',
    examples: 'https://primeng.org/showcase/'
  }
} as const;

/**
 * Helper function para verificar si un componente existe en PrimeNG
 * 
 * @param componentType Tipo de componente buscado
 * @returns true si existe en PrimeNG, false si no
 */
export function hasPrimeNGComponent(componentType: string): boolean {
  const allComponents = Object.values(ComponentContext.components)
    .flatMap(category => Object.values(category));
  
  return allComponents.some(comp => 
    comp.toLowerCase().includes(componentType.toLowerCase())
  );
}

/**
 * Helper function para obtener el nombre del componente PrimeNG
 * 
 * @param category Categoría del componente
 * @param type Tipo específico del componente
 * @returns Nombre del componente PrimeNG o null si no existe
 */
export function getPrimeNGComponent(
  category: keyof typeof ComponentContext.components,
  type: string
): string | null {
  const categoryComponents = ComponentContext.components[category];
  if (!categoryComponents) return null;
  
  const component = (categoryComponents as Record<string, string>)[type];
  return component || null;
}




