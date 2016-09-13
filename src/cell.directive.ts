import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";

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

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
    }

    @Input()
    public set xnCell(args: CellRenderArgs) {
        let r = args.column.cellRenderer(args.data, args.cell, args.row);
        if (r == null || r == "") {
            return;
        }

        if (typeof r === "string") {
            let parser = new DOMParser();
            let document = parser.parseFromString(r, "text/html");
            let body = document.getElementsByTagName("body")[0];
            this.appendToCell(body.firstChild);
            return;
        }

        if (typeof r === "object") {
            this.appendToCell(r);
            return;
        }
    }

    private appendToCell(element: Node): void {
        let root = this.elementRef.nativeElement;
        this.renderer.invokeElementMethod(root, "appendChild", [element])
    }
}