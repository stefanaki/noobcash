const { exec } = require('child_process');

// const nodes = [
// 	{ INDEX: 0, URL: 'http://snf-34464.ok-kno.grnetcloud.net', PORT: 3000 },
// 	{ INDEX: 1, URL: 'http://snf-34465.ok-kno.grnetcloud.net', PORT: 3001 },
// 	{ INDEX: 2, URL: 'http://snf-34466.ok-kno.grnetcloud.net', PORT: 3002 },
// 	{ INDEX: 3, URL: 'http://snf-34467.ok-kno.grnetcloud.net', PORT: 3003 },
// 	{ INDEX: 4, URL: 'http://snf-34468.ok-kno.grnetcloud.net', PORT: 3004 },
// 	{ INDEX: 5, URL: 'http://snf-34464.ok-kno.grnetcloud.net', PORT: 3005 },
// 	{ INDEX: 6, URL: 'http://snf-34465.ok-kno.grnetcloud.net', PORT: 3006 },
// 	{ INDEX: 7, URL: 'http://snf-34466.ok-kno.grnetcloud.net', PORT: 3007 },
// 	{ INDEX: 8, URL: 'http://snf-34467.ok-kno.grnetcloud.net', PORT: 3008 },
// 	{ INDEX: 9, URL: 'http://snf-34468.ok-kno.grnetcloud.net', PORT: 3009 }
// ];

const nodes = [
	{ INDEX: 0, URL: 'http://192.168.0.10', PORT: 3000 },
	{ INDEX: 1, URL: 'http://192.168.0.11', PORT: 3001 },
	{ INDEX: 2, URL: 'http://192.168.0.12', PORT: 3002 },
	{ INDEX: 3, URL: 'http://192.168.0.13', PORT: 3003 },
	{ INDEX: 4, URL: 'http://192.168.0.14', PORT: 3004 },
	{ INDEX: 5, URL: 'http://192.168.0.15', PORT: 3005 },
	{ INDEX: 6, URL: 'http://192.168.0.16', PORT: 3006 },
	{ INDEX: 7, URL: 'http://192.168.0.17', PORT: 3007 },
	{ INDEX: 8, URL: 'http://192.168.0.18', PORT: 3008 },
	{ INDEX: 9, URL: 'http://192.168.0.19', PORT: 3009 }
];

const commands = nodes.map((node) => {
	const { INDEX, URL, PORT, NUM_NODES } = node;
	const command = `./process_transactions.sh ${INDEX} ${URL} ${PORT} 10`;
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve({ stdout, stderr });
			}
		});
	});
});

Promise.all(commands)
	.then((results) => {
		results.forEach(({ stdout, stderr }) => {
			console.log(`stdout: ${stdout}`);
			console.log(`stderr: ${stderr}`);
		});
	})
	.catch((error) => {
		console.error(`Error: ${error}`);
	});
