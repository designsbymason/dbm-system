# @dbm-system/components for AI coding agents

React components for web and enterprise apps. Every component, prop and part is typed and described in a manifest that ships in this package, so read it instead of guessing, and never use a component, part or prop that it does not list.

## Find what you need

1. Read `@dbm-system/components/manifest/index.json`: every component with its tier, category and a sentence, and the path of its file.
2. Read `@dbm-system/components/manifest/components/<Name>.json` for each component you use: its `props` (type, required, default, allowed `values`, description), its `parts` (such as `Menu.Item`), the native props it also takes (`extends`) and its `examples`.
3. Hooks, functions and constants are in `manifest/utilities.json`; `manifest.schema.json` describes each file. The manifest is for the installed version.

## Set up

```bash
pnpm add @dbm-system/components @dbm-system/tokens @dbm-system/icons
```

Tokens and icons are installed beside the components because your app imports from them (the theme CSS, the icons) and the components package does not re-export either.

Import the stylesheet and one theme once, in the app's entry, and choose the theme on the root element:

```ts
import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

```html
<html data-theme="purple-light">
```

The themes are `purple-light`, `purple-dark`, `emerald-light` and `emerald-dark`. The package ships no fonts (`Nunito` and `Lora`); `README.md` in this package has the snippets to load them.

## Use the components

- Import by name: `import { Button } from "@dbm-system/components"`. The parts of a compound component hang off it: `Menu.Trigger`, `Menu.Content`, `Menu.Item`.
- Native props pass through: `Button` takes every `<button>` prop, and `extends` in its file says so. `className`, `style`, `id` and `data-testid` are accepted by nearly every component, and a ref reaches the root element (a component with no single root, such as `Tooltip`, takes none).
- `as` changes the element a layout or text component renders (`<Stack as="ul">`, also `Box`, `Text`, `Heading`). `asChild` renders a component's behaviour onto your own element (`<Button asChild><a href="/pay">Pay</a></Button>`, also `IconButton`, `Link`, `Card`). The component's file says which it takes.
- Icons are component references from `@dbm-system/icons`, never strings: `<Button leadingIcon={PlusIcon}>Add</Button>`. An icon-only control needs an accessible name: `IconButton` requires `aria-label`.
- State: components that hold a value take `value`, `defaultValue` and `onValueChange` (`Tabs`); components that open take `open`, `defaultOpen` and `onOpenChange` (`Dialog`). Pass `value` or `open` to control one, or only the default to leave it to the component.
- `size` is `xs`, `sm`, `md` (the default), `lg` or `xl` wherever a component has it (`Button`, `Input`). A field's invalid state is `hasError`; `FormField` wires a label, helper text and error to the control inside it: `<FormField label="Email">{(fieldProps) => <Input {...fieldProps} />}</FormField>`.
- Layout props take a value or a mobile-first map keyed by `base`, `sm`, `md`, `lg`, `xl`, `2xl` and `3xl`: `<Stack gap={{ base: 2, md: 4 }}>`. Spacing steps are 0 to 6, 8, 10, 12, 16, 20, 24 and 32.
- Text a component writes itself (labels, announcements) is replaceable through a partial `labels` object, and numbers it shows go through `formatNumber` (`Pagination`). English is the default. For right-to-left, pass `dir="rtl"` or wrap the app in `DirectionProvider`, and read it with `useDirection`.
- Components are built to render on the server: they do not read `window` or `document` during the first render. Wrap your own browser-only code in `ClientOnly`.

## Style and theme

- Style with tokens, which are CSS custom properties: `var(--dbm-bg-surface)`, `var(--dbm-text-primary)`, `var(--dbm-border-default)`, `var(--dbm-space-4)`, `var(--dbm-radius-md)`. Use the semantic ones (the `bg`, `text`, `border` and `icon` groups), which change with the theme, and never write a colour, a spacing value or a duration as a literal.
- To switch themes at runtime, set `data-theme` yourself, or wrap the app in `ThemeProvider` (`brand` is `purple` or `emerald`, `mode` is `light`, `dark` or `system`) and read it with `useTheme`.

## Components, hooks and functions

Every public name, by tier and category. `manifest/index.json` has a sentence on each.

<!-- components:start -->

**Atoms**

- Data Display: Avatar, Badge, Skeleton, Tag
- Feedback: ProgressBar, ProgressCircle, Spinner
- Inputs: Button, Checkbox, CloseButton, FieldError, FieldHelperText, FieldLabel, IconButton, Input, Radio, Switch, Textarea
- Layout: Affix, AspectRatio, Bleed, Box, Center, Container, Divider, GridItem, Spacer, Stack
- Media: Icon, Image, Indicators
- Navigation: BackToTop
- Overlay: Backdrop, Collapse, Tooltip, TooltipProvider
- Typography: Blockquote, Code, Heading, Highlight, Kbd, Link, ListItem, Text
- Utility: ClientOnly, DirectionProvider, FocusTrap, Portal, SkipLink, ThemeProvider, VisuallyHidden

**Molecules**

- Data Display: AvatarGroup, Card, DescriptionList, EmptyState, Pagination, Stat, Table, TableToolbar
- Feedback: Alert
- Inputs: ButtonGroup, Calendar, CheckboxGroup, EditableText, FieldGroup, FormField, NumberInput, PasswordInput, PinInput, RadioGroup, RangeSlider, RatingInput, SearchInput, Select, Slider, TagsInput, TimePicker, TimeRangePicker, ToggleGroup, Toolbar
- Layout: Grid, PageHeader, ScrollArea, Splitter
- Navigation: Breadcrumb, TableOfContents, Tabs
- Overlay: Accordion, HoverCard, HoverCardProvider, Popover
- Typography: CodeBlock, List

**Organisms**

- Data Display: DataTable, Timeline, Tree
- Feedback: Toast
- Inputs: ColorPicker, Combobox, DatePicker, DateRangePicker, FileUpload, Form, MultiSelect
- Media: Carousel, ImageViewer, ImageViewerButton
- Navigation: CommandPalette, EditorTabs, Menu, Menubar, Navbar, NavigationMenu, Sidebar, Stepper
- Overlay: AlertDialog, ConfirmDialog, ContextMenu, Dialog, Drawer, Tour

**Templates**

- Shells: AppShell, PageShell

**Hooks:** useAppShell, useCommandPaletteController, useContextMenuController, useDataTable, useDirection, useFormController, useFormState, useImageViewerController, useMenubarController, usePersistentDismiss, useRecentCommands, useSidebar, useTheme, useToast

**Functions:** createToaster, filterTree, formatRelativeTime, registerCodeLanguage

<!-- components:end -->
