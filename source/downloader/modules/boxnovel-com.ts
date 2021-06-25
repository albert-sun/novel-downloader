/* ================================
Name: Boxnovel.com
URL: boxnovel.com
Version: 0.0.1 (06/24/2021)
================================ */

import { ChapterMeta, NovelChapter, NovelMeta, WebsiteModule } from "../structure.js";
import { formatParagraphs } from "../utilities.js";
import asyncPool from "tiny-async-pool";
import fetch from "node-fetch";
import log from "loglevel"; 
import pkg from 'node-html-parser';
const parse = pkg.parse;

const metadata = {
    displayName: "Boxnovel.com",
    moduleID: "boxnovel-com",
    _version: "0.0.1",
    _lastUpdated: "06/24/2021",
};
const settings = {
    maxConcurrent: 25,
};

// Scrape metadata for novel with given URL
async function getNovelMeta(novelURL: string): Promise<NovelMeta> {
    // Retrieve novel metadata page
    const novelResponse = await fetch(novelURL);
    const parsedNovelHTML = parse(await novelResponse.text());

    // Parse relevant information from page
    const postContentItems = parsedNovelHTML.querySelectorAll(".post-content_item");
    const primaryTitle = (parsedNovelHTML.querySelector(".post-title").innerText.trim().split("\n").pop() as string).trim(); // Without HOT or NEW badges
    const alternativeTitles = postContentItems[2].querySelector(".summary-content").innerText.split(", ").map(title => title.trim());
    const _titles = [primaryTitle, ...alternativeTitles]; // Cache all novel titles for search purposes
    const _authors = parsedNovelHTML.querySelector(".author-content").querySelectorAll("a").map(element => element.innerText.trim());
    const _status = postContentItems[8].querySelector(".summary-content").innerText.trim(); // OnGoing, Completed
    const _genres = parsedNovelHTML.querySelector(".genres-content").querySelectorAll("a").map(element => element.innerText);
    const _language = postContentItems[6].querySelector(".summary-content").innerText.trim().split(" Web Novel")[0]; // Format "${language} Web Novel"
    const _synopsis = formatParagraphs(parsedNovelHTML.querySelector("#editdescription").innerText);
    const _chapters: ChapterMeta[] = parsedNovelHTML.querySelectorAll(".wp-manga-chapter")
        .map(element => element.querySelector("a")) // vvv IDK why this requires using return vs default map
        .map(element => { return { name: element.innerText.trim(), url: element.getAttribute("href") as string } }).reverse();

    const meta = {
        titles: _titles,
        authors: _authors,
        status: _status,
        genres: _genres,
        language: _language,
        synopsis: _synopsis,
        chapters: _chapters,
    };

    return meta;
}

// Cache metadata for all novels from website
async function cacheAllNovelMeta(trace: string[]) {
    trace.push("getURLs");

    log.info(`[${metadata.moduleID}] Scraping novel URLs from listings`);

    // Scrape meta URLs for all novels
    let novelURLs: string[] = [];
    for(let listingIndex = 0; listingIndex; listingIndex++) { // Infinite
        // Retrieve listing pages while they exist
        let listingURL = listingIndex === 0
            ? "https://boxnovel.com/novel/" // Base listing page
            : `https://boxnovel.com/novel/page/${listingIndex}/`;
        const listingResponse = await fetch(listingURL);
        if(listingResponse.status === 404) { // No more pages exist, finished
            log.debug(`[${metadata.moduleID}] Finished scraping {${novelURLs.length}} URLs`, trace);
            
            break;
        } else if(listingResponse.status !== 200) { // Invalid status code
            log.debug(`[${metadata.moduleID}] Invalid response status code {${listingResponse.status}}`, trace);
        
            listingIndex--; // "redo" loop iteration
            continue;
        }

        // Parse novel meta URLs from listing HTML
        const parsedListingHTML = parse(await listingResponse.text());
        const listingURLs = parsedListingHTML.querySelectorAll(".post-title")
            .map(element => element.querySelector("a").getAttribute("href") as string);
        novelURLs.concat(listingURLs); // Append to existing URLs
    }

    trace.pop();
    trace.push("getMeta");

    log.info(`[${metadata.moduleID}] Scraping individual novel metadata from URLs`);

    // Limit concurrent requests for retrieving novel metadata
    const novelMetas = await asyncPool(settings.maxConcurrent, novelURLs, getNovelMeta);

    trace.pop();

    log.info(`[${metadata.moduleID}] Finished caching metadata for all novels`);

    return novelMetas;
}

// Download individual novel chapter and include metadata
async function downloadNovelChapter(meta: ChapterMeta): Promise<NovelChapter> {
    // Retrieve novel chapter page
    const chapterResponse = await fetch(meta.url);
    const parsedChapterHTML = parse(await chapterResponse.text());

    // Parse chapter content from page
    const _content = formatParagraphs(parsedChapterHTML.querySelector(".text-left").innerText);

    const chapter = new NovelChapter(meta, _content);

    return chapter;
}

const functions = {
    getNovelMeta,
    cacheAllNovelMeta,
    downloadNovelChapter,
}

export const module = new WebsiteModule(metadata, settings, functions);