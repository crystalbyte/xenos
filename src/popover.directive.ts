import { Directive, Input, ElementRef } from "@angular/core";
import { DataGridColumn } from "./data-grid-column";
import { I18N_SERVICE_PROVIDER, I18nService } from "./i18n.service";

// No typings for jquery.
declare var $: any;

interface PopoverConfig {
    column: DataGridColumn,
    content: HTMLElement,
    input: HTMLInputElement,
    close: HTMLButtonElement
}

@Directive({
    selector: "[xnPopover]",
    providers: [I18N_SERVICE_PROVIDER]
})
export class PopoverDirective {

    constructor(
        private i18nService: I18nService,
        private elementRef: ElementRef) {
        if (!PopoverDirective.initialized) {
            PopoverDirective.initialize();
        }
    }

    private static initialized: boolean = false;

    /// This method will close all popovers of the grid when user clicks outside of one.
    /// http://jsfiddle.net/mattdlockyer/C5GBU/2/
    private static initialize(): void {
        $("body").on("click", function (e) {
            $("[xn-linked]").each(function () {
                //the 'is' for buttons that trigger popups
                //the 'has' for icons within a button that triggers a popup
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $(".popover").has(e.target).length === 0) {
                    $(this).popover("hide");
                }
            });
        });

        PopoverDirective.initialized = true;
    }

    @Input()
    public set xnPopover(config: PopoverConfig) {

        $(config.close).on("click", x => {
            $(this.elementRef.nativeElement).popover("hide");
        });

        $(this.elementRef.nativeElement).popover({
            html: true,
            placement: "bottom",
            trigger: "manual",
            title: this.i18nService.requestTranslation("xn.options.title"),
            content: x => $(config.content)
        }).on("click", e => {
            $(this.elementRef.nativeElement).popover("show");
        }).on("show.bs.popover", e => {
            $(config.content).css("display", "block");
            config.column.reset();
        }).on("shown.bs.popover", e => {
            $(config.input).focus();
        });
    }
}