import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialResourcesModule } from './shared/material-resources/material-resources.module';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TransactionsTableComponent } from './components/transactions-table/transactions-table.component';
import { BalanceCardComponent } from './components/balance-card/balance-card.component';
import { HelpComponent } from './components/help/help.component';
import { CreateTransactionComponent } from './components/create-transaction/create-transaction.component';
import { BalancesChartComponent } from './components/balances-chart/balances-chart.component';
import { ChartsModule } from 'ng2-charts';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginFormComponent,
    TransactionsTableComponent,
    BalanceCardComponent,
    HelpComponent,
    CreateTransactionComponent,
    BalancesChartComponent,
    TransactionsPageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialResourcesModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ChartsModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
