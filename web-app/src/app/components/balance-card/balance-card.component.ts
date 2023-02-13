import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import NodeService from 'src/app/services/node.service';

@Component({
  selector: 'app-balance-card',
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss'],
})
export class BalanceCardComponent implements OnInit {
  balance: number = 0;
  balance$!: Observable<{ balance: number }>;

  constructor(private http: HttpClient, private nodeService: NodeService) {}

  ngOnInit(): void {
    const { url, port } = this.nodeService.self;

    this.balance$ = this.http.get<{ balance: number }>(
      `${url}:${port}/balance`
    );
  }
}

