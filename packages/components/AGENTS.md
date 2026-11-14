# @dbm-system/components for AI coding agents

(The rules for building with the library are written in the next step; this file already carries the generated list below.)

## Components, hooks and functions

Every public name, by tier and category. Read `@dbm-system/components/manifest/index.json` for a sentence on each, then `manifest/components/<Name>.json` for one in full.

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
