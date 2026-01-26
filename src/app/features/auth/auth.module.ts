import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RegisterEmiliano } from './components/register-emiliano/registeremiliano';
import { Recover } from './components/recover/recover';
import { RegisterObrera } from './components/register-obrera/registerobrera';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        FormsModule,
        AuthRoutingModule,
        Login,
        Register,
        RegisterEmiliano,
        RegisterObrera,
        Recover
    ]
})
export class AuthModule { }