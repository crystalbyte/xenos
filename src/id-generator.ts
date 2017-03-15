import { DataGridColumn } from "./data-grid-column"

export class IdGenerator {
    private static lastId: number = 0;

    public static getNextColumnId(): number {
        this.lastId = this.lastId + 1;
        return this.lastId;
    }

    public static synthesizeColumnSortId(column: DataGridColumn): string {
        return `__sort#${column.id}`;
    }
}