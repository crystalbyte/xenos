import { Injectable, provide } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { I18nArgs } from "./i18n.args";
import { I18n } from "./i18n";

// No typings for require
declare var require: any;

export class I18nService implements I18n {

    private locales: any;

    constructor() {
        this.translationRequested = new Subject<I18nArgs>();
    }

    public translationRequested: Subject<I18nArgs>;
    public requestTranslation(key: string): string {
        let args = new I18nArgs(key);
        this.translationRequested.next(args);
        return args.value;
    }
}

export const I18N_SERVICE_PROVIDER = [
    provide(I18nService, {
        useValue: new I18nService()
    })
];