import { Directive, ElementRef, Input, Renderer } from "@angular/core";
import { I18N_SERVICE_PROVIDER, I18nService } from "./i18n.service";

@Directive({
    selector: "[hyI18n]",
    providers: [I18N_SERVICE_PROVIDER]
})
export class I18nDirective {

    constructor(
        private renderer: Renderer,
        private i18nService: I18nService,
        private elementRef: ElementRef) {
    }

    @Input()
    public set hyI18n(key: string) {
        let value = this.i18nService.requestTranslation(key);
        this.renderer.setText(this.elementRef.nativeElement, value); 
    }
}