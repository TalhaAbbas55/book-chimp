// epubUtils.js

import { Book } from 'epubjs';

export async function parseEPUB(file) {
    const book = new Book(file);
    await book.parse();
    return book;
}

export async function searchEPUB(book, query) {
    const results = [];
    for (const chapter of book.chapters) {
        const text = await chapter.getContents();
        const matches = text.matchAll(new RegExp(query, 'gi'));
        for (const match of matches) {
            results.push({
                chapter,
                offset: match.index,
                length: match[0].length,
            });
        }
    }
    return results;
}
