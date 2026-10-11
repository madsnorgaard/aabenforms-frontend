// Minimal typing for the dkfds UMD bundle (dist/js/dkfds.min.js). Only the
// surface we call is typed; everything else is `any`.
declare module 'dkfds' {
  export interface DkfdsComponent {
    init(): void
  }
  export interface DkfdsComponentCtor {
    new (element: Element): DkfdsComponent
  }
  export function init(options?: { scope?: Element | Document }): void
  export const Accordion: DkfdsComponentCtor
  export const Alert: DkfdsComponentCtor
  export const BackToTop: DkfdsComponentCtor
  export const CharacterLimit: DkfdsComponentCtor
  export const CheckboxToggleContent: DkfdsComponentCtor
  export const Dropdown: DkfdsComponentCtor
  export const DropdownSort: DkfdsComponentCtor
  export const ErrorSummary: DkfdsComponentCtor
  export const Modal: DkfdsComponentCtor & { prototype: { show(e?: Event | null): void; hide(): void } }
  export const Navigation: { new (): DkfdsComponent }
  export const MenuDropdown: DkfdsComponentCtor
  export const RadioToggleGroup: DkfdsComponentCtor
  export const ResponsiveTable: { new (element: Element): unknown }
  export const TableSelectableRows: DkfdsComponentCtor
  export const Tabs: DkfdsComponentCtor
  export const Toast: DkfdsComponentCtor
  export const Tooltip: DkfdsComponentCtor
  export const datePicker: { on(scope: Element | Document): void; off(scope: Element | Document): void }
}
