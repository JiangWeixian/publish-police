import type { PackageJson } from 'type-fest';
interface Options {
    root?: string;
    /**
     * @description Stric check
     * - true
     *  If files not defined, will throw error.
     * @default true
     */
    strict?: boolean;
}
interface ResolvedOptions {
    root: string;
    strict: boolean;
    packageJson: PackageJson;
    /**
     * @description Resolved glob files
     * @example if package.files length eqauls 2, files length also equals 2
     */
    files: string[][];
}
export declare const glob: (files: string[], options?: Pick<Options, 'root'>) => Promise<string[][]>;
export declare const resolveOptions: ({ root, strict }: Options) => Promise<ResolvedOptions>;
/**
 * @description Check files field in `package.json`
 */
export declare const distCheck: ({ strict, packageJson, root, files: resolvedFiles }: ResolvedOptions) => Promise<boolean>;
/**
 * @description Check exports field in `package.json`
 */
export declare const exportsCheck: ({ packageJson, root, files }: ResolvedOptions) => Promise<boolean>;
export {};
