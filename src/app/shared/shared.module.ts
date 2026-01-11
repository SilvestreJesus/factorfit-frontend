import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        Header,
        Footer
    ],
    exports: [
        Header,
        Footer
    ]
})
export class SharedModule { }