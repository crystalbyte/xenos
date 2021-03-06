import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { HeaderDirective } from "./header.directive";
import { CellDirective } from "./cell.directive";
import { I18nDirective } from "./i18n.directive";
import { PopoverDirective } from "./popover.directive";
import { I18nService } from "./i18n.service";
import { DataGrid } from "./data-grid.component";
import { CandidateDirective } from "./candidate.directive";

@NgModule({
    imports: [CommonModule, FormsModule],
    declarations: [
        CellDirective,
        HeaderDirective,
        CandidateDirective,
        I18nDirective,
        PopoverDirective,
        DataGrid
    ],
    exports: [
        DataGrid, 
        CandidateDirective, 
        CellDirective, 
        PopoverDirective, 
        HeaderDirective, 
        I18nDirective
    ],
    providers: [I18nService]
})
export class XenosModule { }