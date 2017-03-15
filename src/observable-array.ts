import { DataGridColumn } from "./data-grid-column";
import { ItemsChangedArgs } from "./items-changed.args";
import { Subject } from "rxjs/Subject";

export class ObservableArray<T> extends Array<T> {

    constructor() {
        super();
        this.itemsChanged = new Subject<ItemsChangedArgs<T>>();
    }

    public itemsChanged: Subject<ItemsChangedArgs<T>>;    

    public splice(start: number, deleteCount?: number, ...items: T[]): T[] {
        if (deleteCount == null) {
            deleteCount = this.length;
        }

        var elements = super.splice(start, deleteCount, ...items);
        this.itemsChanged.next(new ItemsChangedArgs([], elements));
        return elements;
    }

    public push(...items: T[]): number {
        items.forEach(x => super.push(x));
        this.itemsChanged.next(new ItemsChangedArgs(items, []));
        return this.length;
    }

    public add(...items: T[]): number {
        items.forEach(x => super.push(x));
        this.itemsChanged.next(new ItemsChangedArgs(items, []));
        return this.length;
    }
}