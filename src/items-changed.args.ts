export class ItemsChangedArgs<T> {

    constructor(itemsAdded: T[], itemsRemoved: T[]) {
        this.itemsAdded = itemsAdded;
        this.itemsRemoved = itemsRemoved;
    }

    public itemsAdded: T[];
    public itemsRemoved: T[];
}