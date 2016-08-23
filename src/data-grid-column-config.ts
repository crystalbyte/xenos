import { SortDirection } from "./sort-direction";

export interface DataGridColumnConfig {
    id?: any;
    headerRenderer: () => string | HTMLElement;
    cellRenderer: (x: any) => string | HTMLElement;
    valueAccessor: (x: any) => any;
    sortDirection?: SortDirection;
}