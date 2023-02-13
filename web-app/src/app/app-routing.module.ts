import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BalanceCardComponent } from './components/balance-card/balance-card.component';
import { HelpComponent } from './components/help/help.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { TransactionsTableComponent } from './components/transactions-table/transactions-table.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginFormComponent },
  { path: 'balance', component: BalanceCardComponent, canActivate: [AuthGuard] },
  { path: 'transaction', component: TransactionsTableComponent, canActivate: [AuthGuard] },
  { path: 'help', component: HelpComponent, canActivate: [AuthGuard] },
  { path: '', component: TransactionsTableComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
