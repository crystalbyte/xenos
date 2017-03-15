import { Directive, ElementRef, Input, Renderer } from "@angular/core";
import { I18nService } from "./i18n.service";

@Directive({
    selector: "[xnI18n]"
})
export class I18nDirective {

    constructor(
        private renderer: Renderer,
        private i18nService: I18nService,
        private elementRef: ElementRef) {
    }

    @Input()
    public set xnI18n(key: string) {
        let value = this.i18nService.requestTranslation(key);
        this.renderer.setText(this.elementRef.nativeElement, value); 
    }
}