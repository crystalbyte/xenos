import { FilterDescriptor } from "./filter-descriptor";
import { DataGridColumn } from "./data-grid-column";

export class FtsFilterDescriptor extends FilterDescriptor {

    public static id: string = "__fts";

    constructor(columns: DataGridColumn[], phrase: string) {
        super(FtsFilterDescriptor.id, x => {
            var regex = new RegExp(`${phrase}`, "i");
            for (let i = 0; i < columns.length; i++) {
                let column = columns[i];
                let value = column.config.valueAccessor(x);

                if (typeof value === "string" && regex.test(value)) {
                    return true;
                }

                if (this.isNumber(value) && regex.test(value.toString())) {
                    return true;
                }
            }

            return false;
        });
    }

    private isNumber(n): boolean {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}