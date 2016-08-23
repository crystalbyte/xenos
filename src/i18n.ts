import { Observable } from "rxjs/Observable";
import { I18nArgs } from "./i18n.args";

export interface I18n {
    translationRequested: Observable<I18nArgs>;
}