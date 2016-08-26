import { Component, ElementRef, Input, Renderer, ViewChild, AfterViewInit } from "@angular/core";
import { ViewSource, ItemsPreview } from "./view-source";
import { CellDirective } from "./cell.directive";
import { HeaderDirective } from "./header.directive";
import { DataGridColumn } from "./data-grid-column";
import { SortDescriptor } from "./sort-descriptor";
import { FilterDescriptor } from "./filter-descriptor";
import { I18N_SERVICE_PROVIDER, I18nService } from "./i18n.service";
import { I18n } from "./i18n";
import { I18nDirective } from "./i18n.directive";
import { ObservableArray } from "./observable-array";
import { PopoverDirective } from "./popover.directive";
import { Observable } from "rxjs/Observable";

// Some IDE's won't recognize the module.
declare var module: { id: any }

@Component({
    moduleId: module.id,
    selector: "data-grid",
    templateUrl: "data-grid.component.html",
    styleUrls: ["data-grid.component.min.css"],
    directives: [CellDirective, HeaderDirective, I18nDirective, PopoverDirective],
    providers: [I18N_SERVICE_PROVIDER]
})
export class DataGrid implements AfterViewInit {

    private itemsPresenter: any[] = [];
    private viewSource: ViewSource = null;
    private pagingRangeInternal: number[] = [];
    private columnsInternal: ObservableArray<DataGridColumn> = null;

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef,
        private i18nService: I18nService) {

        this.viewSource = new ViewSource();
        this.viewSource.itemsViewChanged
            .subscribe(x => this.onItemsViewChanged(x));

        this.viewSource.filterDescriptors.itemsChanged.subscribe(x => {
            this.viewSource.refresh();
        });

        this.columnsInternal = new ObservableArray<DataGridColumn>();
        this.columnsInternal.itemsChanged.subscribe(x => {
            x.itemsRemoved.forEach(x => x.dataGrid = null);
            x.itemsAdded.forEach(x => {
                x.dataGrid = this;
                if (x.sortDirection != null) {
                    this.viewSource.sortDescriptors.push(
                        new SortDescriptor(x.config.id, x.sortDirection, x.config.valueAccessor));
                }
            });
        });
    }

    public get itemsViewChanging(): Observable<ItemsPreview>  {
        return this.viewSource.itemsViewChanging;
    }

    public get itemsViewChanged(): Observable<any[]>  {
        return this.viewSource.itemsViewChanged;
    }

    public get i18n(): I18n {
        return this.i18nService;
    }

    public get columns(): DataGridColumn[] {
        return this.columnsInternal;
    }

    public get working(): boolean {
        return this.viewSource.working;
    }

    public get filterDescriptors(): FilterDescriptor[] {
        return this.viewSource.filterDescriptors;
    }

    public get sortDescriptors(): SortDescriptor[] {
        return this.viewSource.sortDescriptors;
    }

    public get pageCount(): number {
        return this.viewSource.pageCount;
    }

    public get pageIndex(): number {
        return this.viewSource.pageIndex;
    }

    public set pageIndex(value: number) {
        this.viewSource.pageIndex = value;
        this.viewSource.refresh();
    }

    @ViewChild("table")
    private table: ElementRef;

    @Input()
    public set pageSize(value: number) {
        this.viewSource.pageSize = value;
        this.viewSource.refresh();
    }

    public get pageSize(): number {
        return this.viewSource.pageSize;
    }

    public set itemsSource(source: any[]) {
        this.viewSource.itemsSource = source;
        this.viewSource.refresh();
    }

    public get itemsSource(): any[] {
        return this.viewSource.itemsSource;
    }

    private get items(): any[] {
        return this.itemsPresenter;
    }

    private onItemsViewChanged(items: any[]): void {
        this.itemsPresenter.splice(0);
        items.forEach(x => this.itemsPresenter.push(x));
    }

    private onHeaderClicked(event: MouseEvent, column: DataGridColumn): void {
        event.stopPropagation();
        event.preventDefault();

        column.cycleSortDirections();

        if (!event.ctrlKey) {
            this.viewSource.sortDescriptors.splice(0);
            this.columns.forEach(x => {
                if (x.config.id === column.config.id) return;
                x.sortDirection = null;
            });
        }

        let descriptor = new SortDescriptor(column.config.id, column.sortDirection, column.config.valueAccessor);
        let index = this.viewSource.sortDescriptors.findIndex(x => x.id === column.config.id);
        if (~index) {
            this.viewSource.sortDescriptors.splice(index, 1, descriptor);
        } else {
            this.viewSource.sortDescriptors.push(descriptor);
        }

        this.viewSource.refresh();
    }

    private onPageChanged(event: Event, i: number) {
        event.preventDefault();

        this.viewSource.pageIndex = i;
        this.viewSource.refresh();
    }

    private get pagingRange(): number[] {
        this.pagingRangeInternal.splice(0);

        let start: number = this.pageIndex - 4;
        let end: number = this.pageIndex + 5;

        if (start < 0) {
            let s = Math.abs(start);
            start += s;
            end = Math.min(end + Math.abs(s), this.pageCount);
        }

        if (end > this.pageCount) {
            let e = end;
            end = end + (this.pageCount - e);
            start = Math.max(start + (this.pageCount - e), 0);
        }

        for (let i = start; i < end; i++) {
            this.pagingRangeInternal.push(i);
        }

        return this.pagingRangeInternal;
    }

    // Implementation of AfterViewInit
    public ngAfterViewInit(): void {
        // Nada ...
    }
}