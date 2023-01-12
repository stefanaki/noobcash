import fetch from 'node-fetch';

export type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type HttpRequestEndpoint =
	| 'healthcheck'
	| 'ring'
	| 'node'
	| 'block'
	| 'blockchain'
	| 'transaction'
	| 'balance';

export interface HttpRequestInfo {
	url: string;
	port: string;
	endpoint: HttpRequestEndpoint;
	method: HttpRequestMethod;
	body?: any;
}

export default function httpRequest({ url, port, endpoint, method, body }: HttpRequestInfo) {
	return fetch(`${url}:${port}/${endpoint}`, {
		method,
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}