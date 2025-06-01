import axios from 'axios';
import * as cheerio from 'cheerio';

const MIRROR_SOURCES = ["GET", "Cloudflare", "IPFS.io", "Infura"];

export interface Book {
    ID: string;
    Author: string;
    Title: string;
    Publisher?: string;
    Year?: string;
    Pages?: string;
    Language?: string;
    Size?: string;
    Extension?: string;
    Mirror_1: string;
    Mirror_2?: string;
    Mirror_3?: string;
    Mirror_4?: string;
    Mirror_5?: string;
    Edit?: string;
}

export interface DownloadLinks {
    [key: string]: string;
}

export class LibgenSearch {
    private readonly colNames = [
        "ID",
        "Author",
        "Title",
        "Publisher",
        "Year",
        "Pages",
        "Language",
        "Size",
        "Extension",
        "Mirror_1",
        "Mirror_2",
        "Mirror_3",
        "Mirror_4",
        "Mirror_5",
        "Edit",
    ];

    async searchTitle(query: string): Promise<Book[]> {
        return this.search(query, "title");
    }

    async searchAuthor(query: string): Promise<Book[]> {
        return this.search(query, "author");
    }

    async searchTitleFiltered(query: string, filters: Partial<Book>, exactMatch: boolean = true): Promise<Book[]> {
        const results = await this.searchTitle(query);
        return this.filterResults(results, filters, exactMatch);
    }

    async searchAuthorFiltered(query: string, filters: Partial<Book>, exactMatch: boolean = true): Promise<Book[]> {
        const results = await this.searchAuthor(query);
        return this.filterResults(results, filters, exactMatch);
    }

    async resolveDownloadLinks(item: Book): Promise<DownloadLinks> {
        try {
            const response = await axios.get(item.Mirror_1);
            const $ = cheerio.load(response.data);
            const downloadLinks: DownloadLinks = {};

            MIRROR_SOURCES.forEach(source => {
                const link = $(`a:contains("${source}")`).attr('href');
                if (link) {
                    downloadLinks[source] = link;
                }
            });

            return downloadLinks;
        } catch (error) {
            throw new Error('Failed to resolve download links');
        }
    }

    private async search(query: string, searchType: "title" | "author"): Promise<Book[]> {
        if (query.length < 3) {
            throw new Error("Query is too short");
        }

        const queryParsed = query.split(" ").join("%20");
        const searchUrl = `https://libgen.is/search.php?req=${queryParsed}&column=${searchType}`;
        
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        // Remove all <i> tags
        $('i').remove();

        // Get the third table (index 2) which contains the results
        const informationTable = $('table').eq(2);
        const rawData: string[][] = [];

        informationTable.find('tr').slice(1).each((_, row) => {
            const rowData: string[] = [];
            $(row).find('td').each((_, cell) => {
                const link = $(cell).find('a');
                if (link.length && link.attr('title') && link.attr('title') !== '') {
                    rowData.push(link.attr('href') || '');
                } else {
                    rowData.push($(cell).text().trim());
                }
            });
            rawData.push(rowData);
        });

        return rawData.map(row => {
            const book: any = {};
            this.colNames.forEach((col, index) => {
                book[col] = row[index] || '';
            });
            return book as Book;
        });
    }

    private filterResults(results: Book[], filters: Partial<Book>, exactMatch: boolean): Book[] {
        if (exactMatch) {
            return results.filter(result => {
                return Object.entries(filters).every(([key, value]) => 
                    result[key as keyof Book] === value
                );
            });
        } else {
            return results.filter(result => {
                return Object.entries(filters).every(([key, value]) => {
                    const resultValue = result[key as keyof Book];
                    return resultValue && 
                           typeof resultValue === 'string' && 
                           typeof value === 'string' &&
                           resultValue.toLowerCase().includes(value.toLowerCase());
                });
            });
        }
    }

    getFilters(): string[] {
        return this.colNames;
    }
} 