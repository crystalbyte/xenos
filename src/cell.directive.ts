import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";
import { ElementRenderer } from "./element-renderer";

interface CellRenderArgs {
    data: any;
    column: DataGridColumn;
    cell: HTMLTableDataCellElement,
    row: HTMLTableRowElement
}

@Directive({
    selector: "[xnCell]"
})
export class CellDirective {

    private elementRenderer: ElementRenderer;

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
        this.elementRenderer = new ElementRenderer(elementRef, renderer);
    }

    @Input()
    public set xnCell(args: CellRenderArgs) {
        let value = args.column.cellRenderer(args.data, args.cell, args.row);
        if (value == null || value == "") {
            return;
        }

        this.elementRenderer.render(value);
    }
}