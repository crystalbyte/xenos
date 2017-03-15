import { DataGridColumnConfig } from "./data-grid-column-config";
import { DataGrid } from "./data-grid.component";
import { FilterCandidate } from "./filter-candidate";
import { FilterDescriptor } from "./filter-descriptor";
import { ColumnFilterDescriptor } from "./column-filter-descriptor";
import { ColumnSortDescriptor } from "./column-sort-descriptor";
import { SortDirection } from "./sort-direction";
import { SortDescriptor } from "./sort-descriptor";
import { IdGenerator } from "./id-generator";
import { CandidateMatcher } from "./candidate-matcher";
import { DefaultCandidateMatcher } from "./default-candidate-matcher";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import { async } from "rxjs/scheduler/async";
import "rxjs/add/Observable/timer";
import "rxjs/add/operator/debounce";
import "rxjs/add/operator/map";

export class DataGridColumn {

    private threshold: number = 30;
    private config: DataGridColumnConfig;
    private debounceThreshold: number = 200;
    private candidateQueryInternal: string = "";
    private candidates: FilterCandidate[] = [];
    private candidateFinder: Subject<string> = new Subject<string>();
    private sortDirectionCycler: Map<SortDirection, SortDirection> =
    new Map<SortDirection, SortDirection>();

    constructor(config?: DataGridColumnConfig) {
        if (!config) {
            config = this.getDefaultOptions();
        }

        if (!config.id) {
            config.id = IdGenerator.getNextColumnId();
        }

        if (!config.sortDirection) {
            config.sortDirection = undefined;
        }

        this.config = config;
        this.sortDirectionCycler.set(null, SortDirection.ascending);
        this.sortDirectionCycler.set(undefined, SortDirection.ascending);
        this.sortDirectionCycler.set(SortDirection.ascending, SortDirection.descending);
        this.sortDirectionCycler.set(SortDirection.descending, SortDirection.ascending);

        this.matchers = [new DefaultCandidateMatcher()];

        this.candidateFinder.asObservable()
            .debounce(x => Observable.timer(this.debounceThreshold))
            .observeOn(async)
            .map(x => this.findCandidates(x))
            .subscribe(x => {
                this.candidates.splice(0);
                x.forEach(x => this.candidates.push(x));
            });
    }

    public dataGrid: DataGrid;
    public matchers: CandidateMatcher[];

    public get id(): any {
        return this.config.id;
    }

    public get initialSortDirection(): SortDirection {
        return this.config.sortDirection;
    }

    public get sortDirection(): SortDirection {
        this.ensureAttachment();
        let id = IdGenerator.synthesizeColumnSortId(this);
        let desc = this.dataGrid.sortDescriptors.find(x => x.id == id);
        return desc ? desc.direction : undefined;
    }

    public set sortDirection(direction: SortDirection) {
        this.ensureAttachment();

        let id = IdGenerator.synthesizeColumnSortId(this);
        let index = this.dataGrid.sortDescriptors.findIndex(x => x.id === id);
        if (~index) {
            if (direction) {
                let descriptor = new ColumnSortDescriptor(this, direction);
                this.dataGrid.sortDescriptors.splice(index, 1, descriptor);
            } else {
                this.dataGrid.sortDescriptors.splice(index, 1);
            }
        } else {
            if (direction) {
                let descriptor = new ColumnSortDescriptor(this, direction);
                this.dataGrid.sortDescriptors.push(descriptor);
            }
        }
    }

    public get hidden(): boolean {
        return this.config.hidden;
    }

    public set hidden(value: boolean) {
        this.config.hidden = value;
    }

    public get disableSorting(): boolean {
        return this.config.disableSorting;
    }

    public set disableSorting(value: boolean) {
        this.config.disableSorting = value;
    }

    public get disableFiltering(): boolean {
        return this.config.disableFiltering;
    }

    public set disableFiltering(value: boolean) {
        this.config.disableFiltering = value;
    }

    public get valueAccessor(): (x: any) => any {
        return this.config.valueAccessor;
    }

    public get cellRenderer(): (x: any, c?: HTMLTableCellElement, r?: HTMLTableRowElement) => string | HTMLElement {
        return this.config.cellRenderer;
    }

    public get headerRenderer(): (c?: HTMLTableHeaderCellElement, r?: HTMLTableRowElement) => string | HTMLElement {
        return this.config.headerRenderer;
    }

    public get candidateRenderer(): (x: any) => string | HTMLElement {
        return this.config.candidateRenderer;
    }

    private ensureAttachment(): void {
        if (!this.dataGrid) {
            throw new Error("The column is not attached to a grid.");
        }
    }

    private get activeFilters(): ColumnFilterDescriptor[] {
        this.ensureAttachment();

        return this.dataGrid.filterDescriptors
            .map(x => <any>x)
            .filter(x => x.column)
            .map(x => <ColumnFilterDescriptor>x)
            .filter(x => x.column.id === this.id);
    }

    public set candidateQuery(phrase: string) {
        this.candidateQueryInternal = phrase;
        this.candidateFinder.next(phrase);
    }

    public get candidateQuery(): string {
        return this.candidateQueryInternal;
    }

    public reset(): void {
        this.candidateQuery = "";
        this.candidates.splice(0, this.candidates.length);
    }

    public cycleSortDirections(): void {
        this.sortDirection = this.sortDirectionCycler.get(this.sortDirection);
    }

    private removeAllColumnFilters(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        this.ensureAttachment();
        let filters = this.dataGrid.filterDescriptors.filter(x => x.groupId !== this.config.id);
        this.dataGrid.filterDescriptors.splice(0);
        filters.forEach(x => this.dataGrid.filterDescriptors.push(x));
    }

    private removeFilter(event: Event, descriptor: FilterDescriptor): void {
        event.preventDefault();
        event.stopPropagation();

        this.ensureAttachment();
        let index = this.dataGrid.filterDescriptors.findIndex(x => x.id === descriptor.id);
        if (~index) {
            this.dataGrid.filterDescriptors.splice(index, 1);
        }
    }

    private onCandidateClicked(event: Event, candidate: FilterCandidate): void {
        event.preventDefault();
        event.stopPropagation();

        this.ensureAttachment();
        var desc = new ColumnFilterDescriptor(this, candidate.value, x => {
            let value = this.valueAccessor(x);
            return value === candidate.value;
        });

        if (this.dataGrid.filterDescriptors.find(x => x.id === desc.id)) {
            return;
        }

        this.dataGrid.filterDescriptors.push(desc);
    }

    private findCandidates(phrase: string): FilterCandidate[] {
        this.ensureAttachment();

        if (!this.dataGrid.lastSnapShot) {
            return [];
        }

        let distinctDates = new Map<number, Date>();
        let distinctValues = new Map<any, any>();

        // We need to restrict the candidate selection for all columns if filters are set to only
        // allow possible combinations except for the active one in case we want to change the current selection.
        let source = this.activeFilters.length > 0
            ? this.dataGrid.lastSnapShot.items
            : this.dataGrid.lastSnapShot.processedItems;

        source.forEach(x => {
            let value = this.config.valueAccessor(x);

            // Dates require special treatment for they are compared by reference and not by value,
            // which means the Map will not recognize equal dates coming from different instances. 
            if (value instanceof Date) {
                let ms = value.getTime();
                if (!distinctDates.has(ms)) {
                    distinctDates.set(ms, value);
                }

                return;
            }

            if (!distinctValues.has(value)) {
                distinctValues.set(value, value);
            }
        });

        // Merge date and non-date items
        distinctDates.forEach(x => {
            distinctValues.set(x, x);
        }); 

        // If we don't have a specific query and there are only a few items in the source, we simply return all.
        let empty = (phrase == null || phrase == "");
        if (empty && distinctValues.size < this.threshold) {
            let values = [];
            distinctValues.forEach(x => {
                values.push(new FilterCandidate(x));
            });
            return values;
        }

        if (empty) {
            return source;
        }

        let values = [];
        distinctValues.forEach(x => {
            let match = false;

            this.matchers.forEach(y => {
                if (match) {
                    return;
                }

                match = y.match(phrase, x);
            });

            if (match) {
                values.push(new FilterCandidate(x));
            }
        });
        return values;
    }

    private getDefaultOptions(): DataGridColumnConfig {
        return {
            id: undefined,
            headerRenderer: () => undefined,
            disableFiltering: false,
            disableSorting: false,
            hidden: false,
            cellRenderer: x => x,
            valueAccessor: x => x
        }
    }
}