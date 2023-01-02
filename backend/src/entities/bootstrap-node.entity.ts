import INode from 'src/interfaces/node.interface';
import Node from './node.entity';
import config from '../config';
import logger from '../utilities/logger';

export default class BootstrapNode extends Node {
	insertNodeToRing(node: INode) {
		if (this.nodeInfo.length < config.numOfNodes) {
			this.nodeInfo.push(node);
			logger.info(`Node with URL ${node.url}:${node.port} added`);
		}

		if (this.nodeInfo.length === config.numOfNodes) {
			logger.info('Node capacity maxed, broadcasting ring to all nodes');
			this.broadcast('POST', 'ring', { nodes: this.nodeInfo });
		}
	}
}
