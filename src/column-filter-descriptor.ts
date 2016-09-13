import { FilterDescriptor } from "./filter-descriptor";
import { DataGridColumn } from "./data-grid-column";

export class ColumnFilterDescriptor extends FilterDescriptor {

    constructor(column: DataGridColumn, value: any, predicate: (x: any) => any) {
        super(`__filter#${column.id}#${value}`, predicate, column.id);

        this.value = value;
        this.column = column;
    }

    public value: any;
    public column: DataGridColumn;
}