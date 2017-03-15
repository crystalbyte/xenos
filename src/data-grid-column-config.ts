import { SortDirection } from "./sort-direction";

export interface DataGridColumnConfig {
    id?: any;
    headerRenderer: (c?: HTMLTableHeaderCellElement, r?: HTMLTableRowElement) => string | HTMLElement;
    cellRenderer: (x: any, c?: HTMLTableDataCellElement, r?: HTMLTableRowElement) => string | HTMLElement;
    candidateRenderer?: (x: any) => string | HTMLElement;
    valueAccessor: (x: any) => any;
    hidden?: boolean;
    sortDirection?: SortDirection;
    disableSorting?: boolean;
    disableFiltering?: boolean;
}