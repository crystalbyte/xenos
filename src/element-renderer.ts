import { ElementRef, Renderer } from "@angular/core";

export class ElementRenderer {

    constructor(
        private elementRef: ElementRef,
        private renderer: Renderer) { }

    public render(value: string | HTMLElement): void {
        if (typeof value === "string") {
            let parser = new DOMParser();
            let document = parser.parseFromString(value, "text/html");
            let body = document.getElementsByTagName("body")[0];
            this.appendToCell(body.firstChild);
            return;
        }

        if (typeof value === "object") {
            this.appendToCell(value);
            return;
        }
    }

    private appendToCell(element: Node): void {
        let root = this.elementRef.nativeElement;
        this.renderer.invokeElementMethod(root, "appendChild", [element])
    }
}