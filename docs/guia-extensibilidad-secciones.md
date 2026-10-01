# Guía de Extensibilidad de Secciones e Ítems vía sectionRegistry.js

Esta guía está diseñada para desarrolladores y contribuidores de código abierto que deseen agregar nuevos tipos de sección o modificar el comportamiento de las existentes en **Ressume**. 

El sistema sigue estrictamente el **Principio Abierto/Cerrado (Open/Closed Principle)** mediante la combinación de los patrones **Registry**, **Factory**, **Strategy** y **Template**: para crear un nuevo bloque de contenido, **no se deben editar `App.jsx`, `BaseSection.jsx`, `BaseItem.jsx` ni `CVContext.jsx`**. Toda la configuración se realiza a través de `src/registry/sectionRegistry.js`.

---

## 1. Filosofía Arquitectónica: Cero Bloques `switch` o `if (type === ...)`

En versiones legacy del proyecto, la adición de una sección requería bifurcaciones condicionales dispersas en todo el código:
```jsx
// ❌ ANTIPATRÓN OBSOLETO (PROHIBIDO)
if (section.type === 'experience') {
  return <ExperienceSection ... />;
} else if (section.type === 'skills') {
  return <SkillsSection ... />;
}
```

En la arquitectura actual, los componentes estructurales son **plantillas genéricas (Template Pattern)**:
- **`BaseSection.jsx`**: Renderiza el contenedor semántico `<section>`, el encabezado `<h2>`, las manijas de arrastre de `@dnd-kit`, los botones de acción (eliminar, consejos IA, estilo de viñeta) y el botón `+` para añadir elementos. Todas sus clases, etiquetas HTML y banderas de interacción se extraen en tiempo de ejecución del descriptor registrado.
- **`BaseItem.jsx`**: Renderiza el contenedor del ítem, integra los listeners del sensor de arrastre, provee el botón circular de eliminación y delega la renderización del contenido al componente `itemComponent` configurado.
- **`sectionRegistry.js`**: Actúa como la fábrica central (Factory & Registry) donde reside el catálogo de tipos registrados y los adaptadores de serialización (Strategy).

---

## 2. Anatomía del Contrato `SectionDescriptor`

Cada sección se define mediante un descriptor de configuración (`SectionDescriptor`) documentado mediante JSDoc.

```javascript
/**
 * @typedef {Object} SectionDescriptor
 * @property {string} type - Identificador único en minúsculas (e.g. 'portfolio', 'certifications').
 * @property {string} label - Nombre legible para el usuario en menús y modales (e.g. 'Portafolio').
 * @property {string} [defaultTitle=''] - Título inicial renderizado en el <h2> de la sección.
 * @property {'left'|'right'} [defaultColumn='right'] - Columna por defecto en diseño de 2 columnas.
 * @property {string} [icon='FolderPlus'] - Nombre del icono de lucide-react para botones y modales.
 * @property {string} [description] - Texto explicativo mostrado en el catálogo de secciones.
 * 
 * // Control de Comportamiento e Interacciones
 * @property {boolean} [allowDelete=true] - Permite al usuario eliminar la sección completa del CV.
 * @property {boolean} [allowAddItem=true] - Muestra el botón circular '+' para añadir ítems hijos.
 * @property {boolean} [allowDeleteItem=true] - Muestra el botón circular '-' para borrar ítems individuales.
 * @property {boolean} [hasTitle=true] - Si es false, oculta el <h2 className="section-title">.
 * @property {boolean} [hasItemDrag=true] - Habilita la manija de arrastre vertical por cada ítem hijo.
 * @property {boolean} [supportsBulletCustomization=false] - Habilita el popover de estilos de punto/timeline.
 * @property {boolean} [isHeader=false] - Bandera especial para el bloque de perfil/cabecera.
 * @property {boolean} [isSpacer=false] - Bandera para bloques espaciadores de compensación vertical.
 * @property {boolean} [isListItem=false] - Indica que el contenedor representa una lista semántica.
 * 
 * // Contenedores y Estilos (Template Pattern)
 * @property {string} [sectionClass='experience'] - Clase CSS asignada al elemento <section>.
 * @property {string} [wrapperClass] - Clase para el grid interno (cadena vacía desactiva el grid).
 * @property {'div'|'ul'|'ol'|React.ComponentType} [containerTag='div'] - Tag envoltorio de la lista de ítems.
 * @property {string} [containerClass='experience__container bd-grid'] - Clases CSS del contenedor de lista.
 * @property {React.CSSProperties} [containerStyle] - Estilos inline para el contenedor en modo interactivo.
 * @property {React.CSSProperties} [printContainerStyle] - Estilos inline para el contenedor en modo impresión.
 * @property {'div'|'li'|React.ComponentType} [itemTag='div'] - Tag envoltorio de cada ítem ('div' o 'li').
 * @property {string} [itemClass='experience__content'] - Clase CSS de cada ítem.
 * @property {React.CSSProperties} [itemStyle] - Estilos inline del ítem en el editor.
 * @property {React.CSSProperties} [printItemStyle] - Estilos inline del ítem en impresión PDF.
 * 
 * // Componentes React
 * @property {React.ComponentType} [sectionComponent] - Componente personalizado a nivel de sección completa (opcional, p. ej. SpacerBlock).
 * @property {React.ComponentType} itemComponent - Componente React encargado de renderizar los campos editables del ítem.
 * 
 * // Fábricas y Adaptadores Polimórficos (Strategy Pattern)
 * @property {function(Object=): Object} createDefaultItem - Genera un ítem válido con ID único por defecto.
 * @property {function(Object): Object} adaptItem - Transforma un ítem arrastrado desde otra sección.
 * @property {Object<string, string>} [schema] - Tipado declarativo de los campos del ítem.
 * @property {function(Object): string} [renderMarkdown] - Serializador del ítem a formato Markdown.
 * @property {function(Object): string} [renderXML] - Serializador del ítem a formato XML.
 * @property {function(Object): string} [renderPlainText] - Serializador del ítem a texto plano.
 */
```

---

## 3. Tutorial Paso a Paso: Creación de una Sección "Portafolio de Diseños" (`portfolio`)

A continuación se muestra un caso de estudio real para incorporar una sección de proyectos de diseño gráfico o arquitectura con título de proyecto, cliente, fecha, enlace y viñetas de descripción.

### Paso 1: Crear el Componente del Ítem (`src/components/CV/items/PortfolioItem.jsx`)

Cree el archivo con el renderizador del ítem. Debe aceptar las props estándar:
- `item`: Objeto con los datos del elemento actual.
- `sectionId`: ID de la sección contenedora.
- `onUpdateItem`: Función callback `(sectionId, itemId, field, value) => void` (en modo interactivo).
- `isPrint`: Booleano que indica si se está renderizando dentro del pipeline de impresión limpia de PDF.

```jsx
import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import SortableBulletItem from '../SortableBulletItem';
import { ExternalLink } from 'lucide-react';

const PortfolioItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  if (!item) return null;

  const handleUpdate = (field, value) => {
    if (typeof onUpdateItem === 'function') {
      onUpdateItem(sectionId, item.id, field, value);
    }
  };

  return (
    <div className="portfolio__item-content" style={{ width: '100%', marginBottom: 'var(--item-gap, 8px)' }}>
      {/* Cabecera del ítem: Título y Fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 className="experience__title" style={{ margin: 0, fontWeight: 600 }}>
          <InlineEdit
            value={item.title || ''}
            onSave={(val) => handleUpdate('title', val)}
            isPrint={isPrint}
          />
        </h3>
        <span className="experience__date" style={{ fontSize: '0.85rem', color: 'var(--text-color-light)' }}>
          <InlineEdit
            value={item.date || ''}
            onSave={(val) => handleUpdate('date', val)}
            isPrint={isPrint}
          />
        </span>
      </div>

      {/* Subtítulo: Cliente o Rol */}
      <div className="experience__company" style={{ fontSize: '0.9rem', color: 'var(--text-color-light)', marginTop: '2px' }}>
        <InlineEdit
          value={item.client || ''}
          onSave={(val) => handleUpdate('client', val)}
          isPrint={isPrint}
        />
      </div>

      {/* Enlace opcional */}
      {(item.link || !isPrint) && (
        <div style={{ fontSize: '0.82rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isPrint && <ExternalLink size={12} />}
          <InlineEdit
            value={item.link || ''}
            placeholder="URL del proyecto (ej: behance.net/...)"
            onSave={(val) => handleUpdate('link', val)}
            isPrint={isPrint}
          />
        </div>
      )}

      {/* Viñetas enriquecidas mediante SortableBulletItem compartido */}
      {Array.isArray(item.bullets) && item.bullets.length > 0 && (
        <ul className="experience__bullets" style={{ margin: '6px 0 0 0', paddingLeft: '1.2rem' }}>
          {item.bullets.map((bullet, idx) => (
            <SortableBulletItem
              key={bullet.id || idx}
              bullet={bullet}
              index={idx}
              itemId={item.id}
              sectionId={sectionId}
              isPrint={isPrint}
              onUpdate={(newText) => {
                const updated = [...item.bullets];
                if (typeof bullet === 'object') {
                  updated[idx] = { ...bullet, text: newText };
                } else {
                  updated[idx] = newText;
                }
                handleUpdate('bullets', updated);
              }}
              onDelete={() => {
                const updated = item.bullets.filter((_, i) => i !== idx);
                handleUpdate('bullets', updated);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default PortfolioItem;
```

---

### Paso 2: Registrar Serializadores en `src/registry/itemFormatters.js`

Agregue las estrategias de serialización para que la sección pueda exportarse a Markdown, XML y Texto Plano:

```javascript
// src/registry/itemFormatters.js

export const portfolioMarkdown = (item) => {
  if (!item) return '';
  const title = item.title || 'Proyecto';
  const client = item.client ? ` — ${item.client}` : '';
  const date = item.date ? ` (${item.date})` : '';
  const link = item.link ? `\n[Enlace](${item.link})` : '';
  const bullets = Array.isArray(item.bullets)
    ? item.bullets.map(b => `  * ${typeof b === 'object' ? b.text : b}`).join('\n')
    : '';
  return `### ${title}${client}${date}${link}\n${bullets}\n`;
};

export const portfolioXML = (item) => {
  if (!item) return '';
  return `<portfolioItem>
    <title>${escapeXml(item.title || '')}</title>
    <client>${escapeXml(item.client || '')}</client>
    <date>${escapeXml(item.date || '')}</date>
    <link>${escapeXml(item.link || '')}</link>
  </portfolioItem>`;
};

export const portfolioPlainText = (item) => {
  if (!item) return '';
  return `${item.title || ''} | ${item.client || ''} (${item.date || ''})\n`;
};
```

---

### Paso 3: Registrar el Descriptor en `src/registry/sectionRegistry.js`

Importe el componente y los formateadores en `src/registry/sectionRegistry.js` y llame a `registerSectionType`:

```javascript
import PortfolioItem from '../components/CV/items/PortfolioItem';
import { portfolioMarkdown, portfolioXML, portfolioPlainText } from './itemFormatters';

registerSectionType({
  type: 'portfolio',
  label: 'Portafolio de Diseños',
  defaultTitle: 'PORTAFOLIO DESTACADO',
  defaultColumn: 'right',
  icon: 'Palette', // Icono de Lucide
  description: 'Colección de trabajos visuales, enlaces a demos y detalles de cliente.',
  allowDelete: true,
  allowAddItem: true,
  allowDeleteItem: true,
  hasTitle: true,
  hasItemDrag: true,
  supportsBulletCustomization: true,
  sectionClass: 'experience',
  containerTag: 'div',
  containerClass: 'experience__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  get itemComponent() {
    return PortfolioItem;
  },
  renderMarkdown: portfolioMarkdown,
  renderXML: portfolioXML,
  renderPlainText: portfolioPlainText,
  createDefaultItem: () => ({
    id: generateUniqueId('port'),
    title: 'Rediseño de Marca e Identidad Digital',
    client: 'Estudio Creativo Alpha',
    date: '2025',
    link: 'behance.net/usuario/proyecto',
    bullets: [
      'Creación de manual de marca y sistema de diseño completo.',
      'Aumento del 40% en engagement de usuarios tras el lanzamiento.'
    ]
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('port'),
      title: src.title || src.name || 'Nuevo Proyecto',
      client: src.subtitle || src.company || 'Cliente / Empresa',
      date: src.date || '2025',
      link: src.link || '',
      bullets: Array.isArray(src.bullets) ? src.bullets : ['Detalle destacado del trabajo.']
    };
  },
  schema: {
    title: 'string',
    client: 'string',
    date: 'string',
    link: 'string',
    bullets: 'array'
  }
});
```

---

## 4. Adaptación Polimórfica entre Secciones (`adaptItem`)

Una de las características clave de **Ressume** es el arrastre cruzado de ítems entre secciones de distinta naturaleza. Por ejemplo, el usuario puede arrastrar un ítem desde `experience` hacia `portfolio` o hacia `simple_list`.

Cuando se ejecuta un drop inter-sección, `useCVDndCoordinator` invoca:
```javascript
import { adaptItemToSectionType } from '../registry/sectionRegistry';

const adaptedItem = adaptItemToSectionType(draggedItem, targetSection.type);
```

La función de estrategia `adaptItem` del descriptor destino se encarga de:
1. **Preservar el ID único**: Si no existe, genera uno nuevo con prefijo específico (`generateUniqueId`).
2. **Mapear campos análogos**: Un campo `name` o `text` de origen se mapea a `title`, y una cadena `subtitle` o `company` se mapea a `client`.
3. **Evitar corrupción de tipos**: Si el destino espera un array en `bullets` y el origen posee un string en `description`, lo fragmenta por saltos de línea o lo envuelve en un array de 1 elemento.

---

## 5. Verificación y Testing de la Nueva Sección

Para garantizar que el nuevo tipo se integra sin regresiones:

### 5.1 Test Unitario en `src/tests/registry.test.jsx`
Agregue una suite sencilla que confirme el registro y la fábrica de ítems:

```javascript
import { describe, it, expect } from 'vitest';
import { getSectionDescriptor, createDefaultItem, adaptItemToSectionType } from '../registry/sectionRegistry';

describe('Sección Portfolio en Registry', () => {
  it('resuelve el descriptor correctamente con todas sus propiedades obligatorias', () => {
    const desc = getSectionDescriptor('portfolio');
    expect(desc).toBeDefined();
    expect(desc.type).toBe('portfolio');
    expect(desc.allowAddItem).toBe(true);
    expect(desc.itemComponent).toBeDefined();
  });

  it('crea un ítem por defecto conforme al esquema', () => {
    const item = createDefaultItem('portfolio');
    expect(item.id).toMatch(/^port_/);
    expect(item.title).toBeDefined();
    expect(Array.isArray(item.bullets)).toBe(true);
  });

  it('adapta polimórficamente un ítem de experiencia', () => {
    const expItem = {
      id: 'exp_1',
      title: 'Diseñador UI',
      subtitle: 'Agencia XYZ',
      date: '2024',
      bullets: ['Diseño de interfaces']
    };
    const adapted = adaptItemToSectionType(expItem, 'portfolio');
    expect(adapted.title).toBe('Diseñador UI');
    expect(adapted.client).toBe('Agencia XYZ');
  });
});
```

### 5.2 Comprobación en la Interfaz de Usuario
1. Abra el editor y presione el botón **"Agregar Sección"** en el ActionMenu.
2. Compruebe que la nueva tarjeta con etiqueta **"Portafolio de Diseños"** y el icono `Palette` aparece en el modal.
3. Al hacer clic, verifique que la sección se monta en `#area-cv` con su título, manijas de arrastre y botones de edición.
4. Pruebe la impresión limpia (`window.print`) y confirme que el ítem se renderiza como texto vectorial con 0 selectores de edición.

---

## 6. Buenas Prácticas para Desarrolladores

1. **Reutilice `SortableBulletItem.jsx`**: Nunca implemente componentes internos duplicados de viñetas. Todas las listas jerárquicas deben usar `SortableBulletItem`.
2. **Utilice siempre `InlineEdit.jsx`**: Todo texto que pueda ser editado por el usuario debe usar `InlineEdit`, pasando `isPrint={isPrint}` para que en la exportación se renderice como texto estático plano.
3. **Estilos de Impresión Transparentes**: Defina `printItemStyle` y `printContainerStyle` en el descriptor si la sección requiere márgenes o list-styles especiales durante la impresión PDF.
4. **No mute el estado de React directamente**: Las mutaciones deben despacharse mediante `updateSectionItem` o las funciones expuestas por `useCV()`.

---

## 7. Documentos Relacionados

- [Arquitectura del Editor](arquitectura.md): Estructura general, ciclo de vida del estado y jerarquía de componentes.
- [Diseño e Invariantes](diseno-invariantes.md): Paleta de colores, tokens de tipografía y estándares visuales.
- [Invariantes de Impresión PDF](../FRACASO_SALTOS_DE_PAGINA.md): Pipeline estático y preservación de geometrías.
- [Manual de Desarrollo](DEVELOPMENT_MANUAL.md): Guía de desarrollo y comandos de test.
