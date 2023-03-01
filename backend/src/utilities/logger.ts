import { Logger } from 'tslog';
import config from '../config';

export default new Logger({ name: `Node ${config.node}`, stylePrettyLogs: false, minLevel: 4 });
