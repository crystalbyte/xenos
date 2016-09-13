import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";
import { ElementRenderer } from "./element-renderer";

interface CandidateRenderArgs {
    data: any,
    column: DataGridColumn
}

@Directive({
    selector: "[xnCandidate]"
})
export class CandidateDirective {

    private elementRenderer: ElementRenderer;

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
        this.elementRenderer = new ElementRenderer(elementRef, renderer);
    }

    @Input()
    public set xnCandidate(args: CandidateRenderArgs) {
        let func: (x: any) => any = args.column.candidateRenderer || (x => `<span>${x}</span>`);
        let value = func(args.data);

        if (value == null || value == "") {
            return;
        }

        this.elementRenderer.render(value);
    }
}