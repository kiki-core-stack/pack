import { send } from 'h3';
import type { H3Error, H3Event } from 'h3';

export default (error: H3Error, event: H3Event) => send(event, error.message, 'application/json');
