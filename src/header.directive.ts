﻿import { Directive, ElementRef, Renderer, Input } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";
import { ElementRenderer } from "./element-renderer";

interface HeaderRenderArgs {
    column: DataGridColumn;
    cell: HTMLTableDataCellElement,
    row: HTMLTableRowElement
}

@Directive({
    selector: "[xnHeader]"
})
export class HeaderDirective {

    private elementRenderer: ElementRenderer;

    constructor(
        private renderer: Renderer,
        private elementRef: ElementRef) {
        this.elementRenderer = new ElementRenderer(elementRef, renderer);
    }

    @Input()
    public set xnHeader(args: HeaderRenderArgs) {
        let value = args.column.headerRenderer(args.cell, args.row);
        if (value == null || value == "") {
            return;
        }

        this.elementRenderer.render(value);
    }
}