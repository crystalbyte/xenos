import { SortDescriptor } from "./sort-descriptor";
import { SortDirection } from "./sort-direction";
import { FilterDescriptor } from "./filter-descriptor";
import { ObservableArray } from "./observable-array";
import { Subject } from "rxjs/Subject";
import { async } from "rxjs/scheduler/async";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/from";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/observeOn";

export interface ItemsPreview {
    items?: any[];
    filteredItems?: any[];
    sortedItems?: any[];
    viewItems?: any[];
}

export class ViewSource {

    private static empty: any[] = [];
    private itemsSourceInternal: any[];
    private pageSizeInternal: number;
    private pageIndexInternal: number;
    private pageCountInternal: number = 1;
    private itemsPreviewer: Subject<ItemsPreview> = new Subject<ItemsPreview>();
    private itemsLoader: Subject<any[]> = new Subject<any[]>();

    constructor() {
        this.pageIndex = 0;
        this.pageSize = Number.MAX_SAFE_INTEGER;
        this.itemsViewChanging = this.itemsPreviewer
            .asObservable();

        this.itemsViewChanged = this.itemsLoader
            .asObservable()
            .observeOn(async)
            .do(x => this.working = true)
            .map(x => {
                let container: ItemsPreview = {
                    items: x
                };
                return container;
            })
            .map(x => {
                x.filteredItems = this.filterItems(x.items); 
                return x;
            })
            .do(x => this.calculatePageCount(x.filteredItems))
            .map(x => {
                x.sortedItems = this.sortItems(x.filteredItems);
                return x;
            })
            .map(x => {
                x.viewItems = this.applyPaging(x.sortedItems);
                return x;
            })
            .map(x => {
                this.itemsPreviewer.next(x);
                return x.viewItems;
            })
            .do(x => this.working = false);
    }

    public working: boolean = false;
    public itemsViewChanging: Observable<ItemsPreview>;
    public itemsViewChanged: Observable<any[]>;
    public sortDescriptors: ObservableArray<SortDescriptor> = new ObservableArray<SortDescriptor>();
    public filterDescriptors: ObservableArray<FilterDescriptor> = new ObservableArray<FilterDescriptor>();

    private calculatePageCount(items: any[]): void {
        this.pageCountInternal = Math.ceil(items.length / this.pageSize)
    }

    public set pageIndex(value: number) {
        if (value > this.pageCount - 1) {
            throw new RangeError("Page index must be larger than -1 and smaller than the page count plus 1.");
        }

        this.pageIndexInternal = value;
    }

    public get pageIndex(): number {
        return this.pageIndexInternal;
    }

    public set itemsSource(value: any[]) {
        this.itemsSourceInternal = value;
    }

    public get itemsSource(): any[] {
        return this.itemsSourceInternal;
    }

    private applyPaging(items: any[]): any[] {
        var page: any;
        if (this.pageSize > items.length) {
            page = items;
        } else {
            page = this.getPage(items);
        }

        return page;
    }

    private groupFilterDescriptors(descriptors: FilterDescriptor[]): Map<any, FilterDescriptor[]> {
        var placeboId = 0;
        var groups = new Map<any, FilterDescriptor[]>();

        descriptors.forEach(x => {
            let groupId = x.groupId;
            if (groupId == null) {
                groupId = placeboId++;
            }

            if (!groups.has(groupId)) {
                groups.set(groupId, [x]);
            } else {
                groups.get(groupId).push(x);
            }
        });

        return groups;
    }

    private filterItems(items: any[]): any[] {
        return items.filter((x, i) => {

            if (this.filterDescriptors.length === 0) {
                return true;
            }

            // We construct a CNF formula using the provided filter predicates. 
            // All filters with the same groupId are concatenated using the "OR" operator 
            // while all of those groups are then combined using an "AND" -- (A||B)&&(C||D)  
            let expression = true;
            var groups = this.groupFilterDescriptors(this.filterDescriptors);
            groups.forEach((v, i) => {
                let group = v.map(y => y.predicate(x)).reduce((a, b) => a || b, false);
                expression = expression && group;
            });

            return expression;
        });
    }

    private sortItems(items: any[]): any[] {
        return items.sort((a, b) => {
            for (let i = 0; i < this.sortDescriptors.length; i++) {
                let descriptor = this.sortDescriptors[i];
                let v1 = descriptor.valueAccessor(a);
                let v2 = descriptor.valueAccessor(b);

                if (descriptor.direction === SortDirection.descending) {
                    let v = v1;
                    v1 = v2;
                    v2 = v
                }

                let c = v1 === v2 ? 0 : v1 < v2 ? -1 : 1;
                if (c != 0) {
                    return c;
                }
            }

            return 0;
        });
    }

    public set pageSize(value: number) {
        if (value < 1) {
            throw new RangeError("Page size must be larger than 0.");
        }

        this.pageSizeInternal = value;
    }

    public get pageSize(): number {
        return this.pageSizeInternal;
    }

    public get pageCount(): number {
        return this.pageCountInternal;
    }

    private getPage(items: any[]): any[] {
        let index = 0 + this.pageIndex * this.pageSize;
        return items.slice(index, index + this.pageSize);
    }

    public refresh(): void {
        if (this.itemsSourceInternal == null) {
            return;
        }

        this.itemsLoader.next(this.itemsSourceInternal);
    }
}