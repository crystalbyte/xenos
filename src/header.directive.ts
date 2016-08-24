import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";

@Directive({
    selector: "[xnHeader]"
})
export class HeaderDirective {

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
    }

    @Input()
    public set xnHeader(column: DataGridColumn) {

        let r = column.config.headerRenderer();
        if (typeof r === "string") {
            let parser = new DOMParser();
            let document = parser.parseFromString(r, "text/html");
            let body = document.getElementsByTagName("body")[0];
            this.appendToHeader(body.firstChild);
            return;
        }

        if (typeof r === "object") {
            this.appendToHeader(r);
            return;
        }
    }

    private appendToHeader(element: Node): void {
        let root = this.elementRef.nativeElement;
        this.renderer.invokeElementMethod(root, "appendChild", [element])
    }
}