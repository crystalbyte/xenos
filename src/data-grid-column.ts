import { DataGridColumnConfig } from "./data-grid-column-config";
import { DataGrid } from "./data-grid.component";
import { FilterCandidate } from "./filter-candidate";
import { FilterDescriptor } from "./filter-descriptor";
import { ColumnFilterDescriptor } from "./column-filter-descriptor";
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

    private threshold: number = 25;
    private debounceThreshold: number = 200;
    private sortDirectionInternal: SortDirection;
    private candidateQueryInternal: string = "";
    private candidates: FilterCandidate[] = [];
    private candidateFinder: Subject<string> = new Subject<string>();
    private sortDirectionCycler: Map<SortDirection, SortDirection> =
    new Map<SortDirection, SortDirection>();

    constructor(config?: DataGridColumnConfig) {
        this.sortDirectionCycler.set(null, SortDirection.ascending);
        this.sortDirectionCycler.set(SortDirection.ascending, SortDirection.descending);
        this.sortDirectionCycler.set(SortDirection.descending, SortDirection.ascending);
        this.sortDirection = null;

        if (config == null) {
            config = this.getDefaultOptions();
        }

        if (config.id == null) {
            config.id = IdGenerator.getNext();
        }

        if (config.sortDirection != null) {
            this.sortDirection = config.sortDirection;
        }

        this.config = config;
        this.candidateFinder.asObservable()
            .debounce(x => Observable.timer(this.debounceThreshold))
            .observeOn(async)
            .map(x => this.findCandidates(x))
            .subscribe(x => {
                this.candidates.splice(0);
                x.forEach(x => this.candidates.push(x));
            });
    }

    public config: DataGridColumnConfig;
    public dataGrid: DataGrid;

    public get sortDirection(): SortDirection {
        return this.sortDirectionInternal;
    }

    public set sortDirection(direction: SortDirection) {
        this.sortDirectionInternal = direction;
    }

    private get activeFilters(): ColumnFilterDescriptor[] {
        return this.dataGrid.filterDescriptors
            .map(x => <any>x)
            .filter(x => x.column != null)
            .map(x => <ColumnFilterDescriptor>x)
            .filter(x => x.column.config.id == this.config.id);
    }

    public set candidateQuery(value: string) {
        this.candidateQueryInternal = value;
        this.candidateFinder.next(value);
    }

    public get candidateQuery(): string {
        return this.candidateQueryInternal;
    }

    public reset(): void {
        this.candidateQuery = "";
        this.candidates.splice(0, this.candidates.length);
    }

    public cycleSortDirections(): void {
        this.sortDirectionInternal = this.sortDirectionCycler.get(this.sortDirectionInternal);
    }

    private removeAllColumnFilters(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        let filters = this.dataGrid.filterDescriptors.filter(x => x.groupId !== this.config.id);
        this.dataGrid.filterDescriptors.splice(0);
        filters.forEach(x => this.dataGrid.filterDescriptors.push(x));
    }

    private removeFilter(event: Event, descriptor: FilterDescriptor): void {
        event.preventDefault();
        event.stopPropagation();

        let index = this.dataGrid.filterDescriptors.findIndex(x => x.id === descriptor.id);
        if (~index) {
            this.dataGrid.filterDescriptors.splice(index, 1);
        }
    }

    private onCandidateClicked(event: Event, candidate: FilterCandidate): void {
        event.preventDefault();
        event.stopPropagation();

        var desc = new ColumnFilterDescriptor(this, candidate.value, x => {
            let value = this.config.valueAccessor(x);
            return value === candidate.value;
        });

        if (this.dataGrid.filterDescriptors.find(x => x.id === desc.id)) {
            return;
        }

        this.dataGrid.filterDescriptors.push(desc);
    }

    private findCandidates(query: string): FilterCandidate[] {

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
            id: null,
            headerRenderer: () => "",
            cellRenderer: x => x,
            valueAccessor: x => x
        }
    }
}