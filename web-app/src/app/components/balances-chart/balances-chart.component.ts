import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartOptions, ChartType } from 'chart.js';
import { concat, interval, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import NodeService from 'src/app/services/node.service';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-balances-chart',
  templateUrl: './balances-chart.component.html',
  styleUrls: ['./balances-chart.component.scss'],
})
export class BalancesChartComponent implements OnInit, OnDestroy {
  balances$!: Observable<{ balances: number[] }>;
  balancesSubscription!: Subscription;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(private nodeService: NodeService, private http: HttpClient) {}

  ngOnDestroy(): void {
    this.balancesSubscription?.unsubscribe();
  }

  public doughnutChartOptions: ChartOptions = {
    responsive: true,
    animation: { duration: 0 },
    legend: { display: true, align: 'center' },
    title: { display: true },
  };
  public doughnutChartLabels: Array<any> = [];
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartLegend = true;
  public doughnutChartData = [
    { data: [10, 20, 30, 40, 50], label: 'Network Balances' },
  ];
  ngOnInit() {
    const { url, port } = this.nodeService.self;

    const initialRequest$ = this.http.get<{ balances: number[] }>(
      `${url}:${port}/balances`
    );

    this.balances$ = concat(
      initialRequest$,
      interval(5000).pipe(
        switchMap(() =>
          this.http.get<{ balances: number[] }>(`${url}:${port}/balances`)
        )
      )
    );

    this.balancesSubscription = this.balances$.subscribe((data) => {
      console.log(data);

      this.doughnutChartLabels = Array.from(
        { length: data.balances.length },
        (_, i) => `Node ${i}`
      );

      this.doughnutChartData = [
        {
          data: data.balances,
          label: 'Network Balances',
        },
      ];
    });

    this.chart?.update('none');
  }
}
