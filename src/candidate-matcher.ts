export interface CandidateMatcher {
    match: (phrase: string, value: any) => boolean;
}