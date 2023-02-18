import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BalanceCardComponent } from './components/balance-card/balance-card.component';
import { HelpComponent } from './components/help/help.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AuthGuard } from './guards/auth.guard';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';

const routes: Routes = [
  { path: 'login', component: LoginFormComponent },
  { path: 'balance', component: BalanceCardComponent, canActivate: [AuthGuard] },
  { path: 'transaction', component: TransactionsPageComponent, canActivate: [AuthGuard] },
  { path: 'help', component: HelpComponent, canActivate: [AuthGuard] },
  { path: '', component: TransactionsPageComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
