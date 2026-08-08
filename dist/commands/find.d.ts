export interface FindOptions {
    profile: string;
    /** Locator mode: text, role, label, placeholder, testid */
    mode: 'text' | 'role' | 'label' | 'placeholder' | 'testid';
    /** Value to match */
    value: string;
    /** Optional action: click, fill, type, inspect, text, html */
    action?: 'click' | 'fill' | 'type' | 'inspect' | 'text' | 'html';
    /** Value for fill/type action */
    actionValue?: string;
    /** If true, output as JSON */
    json?: boolean;
}
export declare function find(options: FindOptions): Promise<void>;
//# sourceMappingURL=find.d.ts.map