import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { concat, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import ITransaction from '../shared/interfaces/transaction.interface';
import NodeService from './node.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  latestTransactions: ITransaction[] = [];

  constructor(private http: HttpClient, private nodeService: NodeService) {}

  fetchLatestTransactions() {
    const initialRequest$ = this.http.get<{ transactions: ITransaction[] }>(
      `${this.nodeService.self.url}:${this.nodeService.self.port}/transaction`
    );

    return concat(
      initialRequest$,
      interval(5000).pipe(
        switchMap(() =>
          this.http
            .get<{ transactions: ITransaction[] }>(
              `${this.nodeService.self.url}:${this.nodeService.self.port}/transaction`
            )
            .pipe(
              tap((data) => {
                this.latestTransactions = data.transactions;
                console.log(this.latestTransactions);
              })
            )
        )
      )
    );
  }
}
