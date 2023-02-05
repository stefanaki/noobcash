export default class NoobcashException extends Error {
    message: string;
    code: number;

    constructor(message: string, code: number = 400) {
        super(message);
        this.message = message;
        this.code = code;
    }
}
