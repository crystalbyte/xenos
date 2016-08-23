import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";

interface CellRenderArgs {
    data: any;
    column: DataGridColumn;
}

@Directive({
    selector: "[hyCell]"
})
export class CellDirective {

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
    }

    @Input()
    public set hyCell(value: CellRenderArgs) {
        let r = value.column.config.cellRenderer(value.data);
        if (typeof r === "string") {
            let parser = new DOMParser();
            let document = parser.parseFromString(r, "text/html");
            let body = document.getElementsByTagName("body")[0];
            this.appendToCell(body.firstChild);
            return;
        }

        if (typeof r === "[object Object]") {
            this.appendToCell(r);
            return;
        }
    }

    private appendToCell(element: Node): void {
        let root = this.elementRef.nativeElement;
        this.renderer.invokeElementMethod(root, "appendChild", [element])
    }
}