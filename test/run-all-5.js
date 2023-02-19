const { exec } = require('child_process');

const nodes = [
	{ INDEX: 0, URL: 'http://snf-34919.ok-kno.grnetcloud.net', PORT: 3000 },
	{ INDEX: 1, URL: 'http://snf-34920.ok-kno.grnetcloud.net', PORT: 3001 },
	{ INDEX: 2, URL: 'http://snf-34921.ok-kno.grnetcloud.net', PORT: 3002 },
	{ INDEX: 3, URL: 'http://snf-34922.ok-kno.grnetcloud.net', PORT: 3003 },
	{ INDEX: 4, URL: 'http://snf-34923.ok-kno.grnetcloud.net', PORT: 3004 }
];

// const nodes = [
// 	{ INDEX: 0, URL: 'http://192.168.0.10', PORT: 3000 },
// 	{ INDEX: 1, URL: 'http://192.168.0.11', PORT: 3001 },
// 	{ INDEX: 2, URL: 'http://192.168.0.12', PORT: 3002 },
// 	{ INDEX: 3, URL: 'http://192.168.0.13', PORT: 3003 },
// 	{ INDEX: 4, URL: 'http://192.168.0.14', PORT: 3004 }
// ];

const commands = nodes.map((node) => {
	const { INDEX, URL, PORT } = node;
	const command = `./process_transactions.sh ${INDEX} ${URL} ${PORT} 5`;
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
