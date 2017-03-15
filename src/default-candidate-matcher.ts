import { CandidateMatcher } from "./candidate-matcher";

export class DefaultCandidateMatcher implements CandidateMatcher {

    private cases: Map<any, (s, v) => boolean>;

    constructor() {
        this.cases = new Map<any, (s, v) => boolean>();
        this.cases.set(String.prototype.constructor, DefaultCandidateMatcher.matchString);
        this.cases.set(Number.prototype.constructor, DefaultCandidateMatcher.matchNumber);
        this.cases.set(Boolean.prototype.constructor, DefaultCandidateMatcher.matchBoolean);
        this.cases.set(Date.prototype.constructor, DefaultCandidateMatcher.matchDate);
    }

    // Implementation of CandidateMatcher
    public match(phrase: string, value: Object): boolean {
        if (value == null) {
            return false;
        }

        if (this.cases.has(value.constructor)) {
            return this.cases.get(value.constructor)(phrase, value);
        }

        return false;
    }

    private static matchDate(phrase: string, value: Date): boolean {
        let date = value.toLocaleDateString();
        let index = date.indexOf(phrase);
        return index >= 0;
    }

    private static matchBoolean(phrase: string, value: boolean): boolean {
        var regex = new RegExp(`yes|no|true|false|1|0`, "i");
        let result = regex.exec(phrase);
        if (result.length == 0) {
            return false;
        }

        let b = new Boolean(result[0]);
        return value == b;
    }

    private static matchString(phrase: string, value: string): boolean {
        var regex = new RegExp(`${phrase}`, "i");
        return regex.test(value);
    }

    private static matchNumber(phrase: string, value: number): boolean {
        var regex = new RegExp(`${phrase}`, "i");
        return regex.test(value.toString());
    }
}