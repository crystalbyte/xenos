import { DataGridColumnConfig } from "./data-grid-column-config";
import { DataGrid } from "./data-grid.component";
import { FilterCandidate } from "./filter-candidate";
import { FilterDescriptor } from "./filter-descriptor";
import { ColumnFilterDescriptor } from "./column-filter-descriptor";
import { ColumnSortDescriptor } from "./column-sort-descriptor";
import { SortDirection } from "./sort-direction";
import { SortDescriptor } from "./sort-descriptor";
import { IdGenerator } from "./id-generator";
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
        this.sortDirectionCycler.set(undefined, SortDirection.ascending);
        this.sortDirectionCycler.set(SortDirection.ascending, SortDirection.descending);
        this.sortDirectionCycler.set(SortDirection.descending, SortDirection.ascending);

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

    private findCandidates(query: string): FilterCandidate[] {
        this.ensureAttachment();

        let distinctValues = new Map<any, any>();
        this.dataGrid.itemsSource.forEach(x => {
            let value = this.config.valueAccessor(x);
            if (!distinctValues.has(value)) {
                distinctValues.set(value, x);
            }
        });

        let empty = (query == null || query == "");
        // If we don't have a specific query and there are only a few items in the source, we simply return all.
        if (empty && distinctValues.size < this.threshold) {
            let values = [];
            distinctValues.forEach(x => {
                let value = this.config.valueAccessor(x);
                values.push(new FilterCandidate(value));
            });
            return values;
        }

        var regex = new RegExp(`${query}`, "i");

        let candidates = [];
        this.dataGrid.itemsSource.some(x => {
            let value = this.config.valueAccessor(x);
            if (value === query) {
                candidates.push(new FilterCandidate(value));
                return false;
            }

            if (this.isNumber(value)) {
                let num = <number>value;
                if (regex.test(num.toString())) {
                    candidates.push(new FilterCandidate(value));
                    return false;
                }
            }

            if (typeof value === "string") {
                let text = <string>value;
                if (regex.test(value)) {
                    candidates.push(new FilterCandidate(value));
                }
            }

            return false;
        });

        return candidates;
    }

    private isNumber(n): boolean {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    private getDefaultOptions(): DataGridColumnConfig {
        return {
            id: undefined,
            headerRenderer: () => undefined,
            cellRenderer: x => x,
            valueAccessor: x => x
        }
    }
}