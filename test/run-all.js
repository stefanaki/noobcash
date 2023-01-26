const { exec } = require('child_process');

// const nodes = [
// 	{ INDEX: 0, URL: 'http://snf-34464.ok-kno.grnetcloud.net', PORT: 3000, NUM_NODES: 5 },
// 	{ INDEX: 1, URL: 'http://snf-34465.ok-kno.grnetcloud.net', PORT: 3001, NUM_NODES: 5 },
// 	{ INDEX: 2, URL: 'http://snf-34466.ok-kno.grnetcloud.net', PORT: 3002, NUM_NODES: 5 },
// 	{ INDEX: 3, URL: 'http://snf-34467.ok-kno.grnetcloud.net', PORT: 3003, NUM_NODES: 5 },
// 	{ INDEX: 4, URL: 'http://snf-34468.ok-kno.grnetcloud.net', PORT: 3004, NUM_NODES: 5 }
// ];

const nodes = [
	{ INDEX: 0, URL: 'http://192.168.0.10', PORT: 3000, NUM_NODES: 5 },
	{ INDEX: 1, URL: 'http://192.168.0.11', PORT: 3001, NUM_NODES: 5 },
	{ INDEX: 2, URL: 'http://192.168.0.12', PORT: 3002, NUM_NODES: 5 },
	{ INDEX: 3, URL: 'http://192.168.0.13', PORT: 3003, NUM_NODES: 5 },
	{ INDEX: 4, URL: 'http://192.168.0.14', PORT: 3004, NUM_NODES: 5 }
];

const commands = nodes.map((node) => {
	const { INDEX, URL, PORT, NUM_NODES } = node;
	const command = `./process_transactions.sh ${INDEX} ${URL} ${PORT} ${NUM_NODES}`;
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
