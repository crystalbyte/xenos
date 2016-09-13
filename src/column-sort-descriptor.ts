import { SortDescriptor } from "./sort-descriptor";
import { DataGridColumn } from "./data-grid-column";
import { SortDirection } from "./sort-direction";
import { IdGenerator } from "./id-generator";

export class ColumnSortDescriptor extends SortDescriptor {

    constructor(column: DataGridColumn, direction: SortDirection) {
        super(IdGenerator.synthesizeColumnSortId(column), direction, column.valueAccessor);
        
        this.column = column;
    }

    public column: DataGridColumn;
}