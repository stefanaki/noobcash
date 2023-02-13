import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { concat, interval, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import NodeService from 'src/app/services/node.service';

@Component({
  selector: 'app-balance-card',
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss'],
})
export class BalanceCardComponent implements OnInit, OnDestroy {
  balance$!: Observable<{ balance: number }>;

  constructor(private http: HttpClient, private nodeService: NodeService) {}

  ngOnDestroy(): void {
    this.balance$?.subscribe();
  }

  ngOnInit(): void {
    const { url, port } = this.nodeService.self;

    const initialRequest$ = this.http.get<{ balance: number }>(
      `${url}:${port}/balance`
    );

    this.balance$ = concat(
      initialRequest$,
      interval(5000).pipe(
        switchMap(() =>
          this.http.get<{ balance: number }>(`${url}:${port}/balance`)
        )
      )
    );
  }
}
