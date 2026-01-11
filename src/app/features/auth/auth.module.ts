import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Recover } from './components/recover/recover';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        FormsModule,
        AuthRoutingModule,
        Login,
        Register,
        Recover
    ]
})
export class AuthModule { }