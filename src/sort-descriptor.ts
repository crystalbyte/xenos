import { SortDirection } from "./sort-direction";

export class SortDescriptor {
    constructor(id: any, direction: SortDirection, valueAccessor: (x: any) => any) {
        this.id = id;
        this.direction = direction;
        this.valueAccessor = valueAccessor;
    }

    public id: any;
    public direction: SortDirection;
    public valueAccessor: (x: any) => any;
}