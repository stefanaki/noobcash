import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import INode from '../shared/interfaces/node.interface';

import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export default class NodeService {
  ring: INode[] = [];

  self: INode = {
    index: 0,
    port: '',
    publicKey: '',
    url: ''
  };

  constructor(private http: HttpClient) {}

  fetchRing(url: string, port: string) {
    this.self.url = url;
    this.self.port = port;

    return this.http
      .get<{ ring: INode[] }>(`${url}:${port}/ring`)
      .pipe(tap(({ ring }) => (this.ring = ring)));
  }
}
