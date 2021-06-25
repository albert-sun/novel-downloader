// Downloader handles all downloading and parsing of novels from websites
export class Downloader {
    modules: WebsiteModule[]; // Added modularly

    constructor(options: DownloaderOptions) {
        this.modules = []; 
    }
}

// DownloaderSettings contains settings for Downloader
interface DownloaderOptions {
}

// WebsiteModule represents a module for an individual website
export class WebsiteModule {
    displayName: string; // Website display name
    moduleID: string;    // Output-friendly module ID
    _version: string;    // [DEV] Current module version

    maxConcurrent: number; // Maximum concurrent requests PER session

    getNovelMeta: { (url: string): Promise<NovelMeta> };
    cacheAllNovelMeta: { (trace: string[]): Promise<NovelMeta[]> }; // Cache all novel metadata
    downloadNovelChapter: { (meta: ChapterMeta): Promise<NovelChapter> };

    constructor(options: WebsiteModuleMeta, settings: WebsiteModuleSettings, handlers: WebsiteModuleHandlers) {
        this.displayName = options.displayName;
        this.moduleID = options.moduleID;
        this._version = options._version;

        this.maxConcurrent = settings.maxConcurrent;

        this.getNovelMeta = handlers.getNovelMeta;
        this.cacheAllNovelMeta = handlers.cacheAllNovelMeta;
        this.downloadNovelChapter = handlers.downloadNovelChapter;
    }
}

export interface WebsiteModuleMeta {
    displayName: string;
    moduleID: string;
    _version: string;
    _lastUpdated: string;
}

export interface WebsiteModuleSettings {
    maxConcurrent: number;
}

export interface WebsiteModuleHandlers {
    getNovelMeta: { (url: string): Promise<NovelMeta> };
    cacheAllNovelMeta: { (trace: string[]): Promise<NovelMeta[]> };
    downloadNovelChapter: { (meta: ChapterMeta): Promise<NovelChapter> };
}

// Novel metadata from search results or novel page
// Undefined means data not found, usually ignoring is safe
export interface NovelMeta {
    titles: string[];
    authors: string[];
    status: string;
    genres: string[];
    language: string;
    synopsis: string;
    chapters: ChapterMeta[];
}

export interface ChapterMeta {
    name: string;
    url: string;
}

export class NovelChapter {
    name: string;
    url: string;
    content: string;

    constructor(meta: ChapterMeta, content: string) {
        this.name = meta.name;
        this.url = meta.url;
        this.content = content;
    }
}