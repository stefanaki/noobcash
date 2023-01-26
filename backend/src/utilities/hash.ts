import { createHash } from 'crypto';

export default function hash(data: any): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
