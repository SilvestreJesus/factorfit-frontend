import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Recover } from './components/recover/recover';
import { Register } from './components/register/register';

const routes: Routes = [
    {
        path: 'login', // Ruta: /auth/login
        component: Login
    },
    {
        path: 'register', // Ruta: /auth/register
        component: Register
    },    
    {
        path: 'recover', // Ruta: /auth/register
        component: Recover
    },
    {
        path: '', // Si solo se navega a /auth, redirige a /auth/login
        redirectTo: 'login',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule { }