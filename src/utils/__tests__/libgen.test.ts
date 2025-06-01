import { jest } from '@jest/globals';
import { LibgenSearch, Book } from '../libgen.js';

interface MockResponse {
    data: string;
}

// Mock axios and cheerio
const mockAxios = {
    get: jest.fn<() => Promise<MockResponse>>()
};

const mockCheerio = {
    load: jest.fn()
};

jest.mock('axios', () => ({
    default: mockAxios,
    get: mockAxios.get
}));
jest.mock('cheerio', () => mockCheerio);

describe('LibgenSearch', () => {
    let libgen: LibgenSearch;

    beforeEach(() => {
        libgen = new LibgenSearch();
        jest.clearAllMocks();
    });

    describe('searchTitle', () => {
        it('should throw error for short queries', async () => {
            await expect(libgen.searchTitle('ab')).rejects.toThrow('Query is too short');
        });

        it('should search books by title', async () => {
            const mockResponse = {
                data: `
                    <table>
                        <tr><td>ID</td><td>Author</td><td>Title</td></tr>
                        <tr>
                            <td>1</td>
                            <td>John Doe</td>
                            <td><a href="http://example.com">Test Book</a></td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Jane Smith</td>
                            <td><a href="http://example.com">Another Test Book</a></td>
                        </tr>
                    </table>
                `
            };
            mockAxios.get.mockResolvedValue(mockResponse);
            mockCheerio.load.mockReturnValue({
                remove: jest.fn(),
                find: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                slice: jest.fn().mockReturnThis(),
                each: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
                    const callback = args[0];
                    callback(0, '<tr><td>1</td><td>John Doe</td><td><a href="http://example.com">Test Book</a></td></tr>');
                    callback(1, '<tr><td>2</td><td>Jane Smith</td><td><a href="http://example.com">Another Test Book</a></td></tr>');
                }),
                text: jest.fn().mockImplementation((text) => {
                    if (text === 'Test Book') return 'Test Book';
                    if (text === 'Another Test Book') return 'Another Test Book';
                    return '';
                }),
                attr: jest.fn().mockReturnValue('http://example.com')
            } as any);

            const results = await libgen.searchTitle('test book');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('Title');
            expect(results[0]).toHaveProperty('Author');
        });
    });

    describe('searchAuthor', () => {
        it('should throw error for short queries', async () => {
            await expect(libgen.searchAuthor('ab')).rejects.toThrow('Query is too short');
        });

        it('should search books by author', async () => {
            const mockResponse = {
                data: `
                    <table>
                        <tr><td>ID</td><td>Author</td><td>Title</td></tr>
                        <tr>
                            <td>1</td>
                            <td>Doe, John; Lewin, Leonard C.</td>
                            <td><a href="http://example.com">Test Book</a></td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Doe, John; Lewin, Leonard C.</td>
                            <td><a href="http://example.com">Another Book</a></td>
                        </tr>
                    </table>
                `
            };
            mockAxios.get.mockResolvedValue(mockResponse);
            mockCheerio.load.mockReturnValue({
                remove: jest.fn(),
                find: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                slice: jest.fn().mockReturnThis(),
                each: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
                    const callback = args[0];
                    callback(0, '<tr><td>1</td><td>Doe, John; Lewin, Leonard C.</td><td><a href="http://example.com">Test Book</a></td></tr>');
                    callback(1, '<tr><td>2</td><td>Doe, John; Lewin, Leonard C.</td><td><a href="http://example.com">Another Book</a></td></tr>');
                }),
                text: jest.fn().mockImplementation((text) => {
                    if (text === 'Test Book') return 'Test Book';
                    if (text === 'Another Book') return 'Another Book';
                    if (text === 'Doe, John; Lewin, Leonard C.') return 'Doe, John; Lewin, Leonard C.';
                    return '';
                }),
                attr: jest.fn().mockReturnValue('http://example.com')
            } as any);

            const results = await libgen.searchAuthor('John Doe');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('Author', 'Doe, John; Lewin, Leonard C.');
            expect(results[0]).toHaveProperty('Title');
        });
    });

    describe('searchTitleFiltered', () => {
        it('should filter results with exact match', async () => {
            const mockBooks: Book[] = [
                {
                    ID: '1',
                    Author: 'John Doe',
                    Title: 'Test Book',
                    Mirror_1: 'http://example.com'
                },
                {
                    ID: '2',
                    Author: 'Jane Smith',
                    Title: 'Another Book',
                    Mirror_1: 'http://example.com'
                }
            ];

            jest.spyOn(libgen as any, 'searchTitle').mockResolvedValue(mockBooks);

            const results = await libgen.searchTitleFiltered('test', { Author: 'John Doe' }, true);
            expect(results).toHaveLength(1);
            expect(results[0].Author).toBe('John Doe');
        });

        it('should filter results with multiple criteria', async () => {
            const mockBooks: Book[] = [
                {
                    ID: '1',
                    Author: 'John Doe',
                    Title: 'Test Book',
                    Language: 'English',
                    Extension: 'epub',
                    Mirror_1: 'http://example.com'
                },
                {
                    ID: '2',
                    Author: 'Jane Smith',
                    Title: 'Another Book',
                    Language: 'Spanish',
                    Extension: 'pdf',
                    Mirror_1: 'http://example.com'
                }
            ];

            jest.spyOn(libgen as any, 'searchTitle').mockResolvedValue(mockBooks);

            const results = await libgen.searchTitleFiltered('test', {
                Language: 'English',
                Extension: 'epub'
            }, true);
            expect(results).toHaveLength(1);
            expect(results[0].Language).toBe('English');
            expect(results[0].Extension).toBe('epub');
        });
    });

    describe('searchAuthorFiltered', () => {
        it('should filter results with exact match', async () => {
            const mockBooks: Book[] = [
                {
                    ID: '1',
                    Author: 'John Doe',
                    Title: 'Test Book',
                    Language: 'English',
                    Mirror_1: 'http://example.com'
                },
                {
                    ID: '2',
                    Author: 'John Smith',
                    Title: 'Another Book',
                    Language: 'Spanish',
                    Mirror_1: 'http://example.com'
                }
            ];

            jest.spyOn(libgen as any, 'searchAuthor').mockResolvedValue(mockBooks);

            const results = await libgen.searchAuthorFiltered('John', { Language: 'English' }, true);
            expect(results).toHaveLength(1);
            expect(results[0].Author).toBe('John Doe');
            expect(results[0].Language).toBe('English');
        });

        it('should return all results with partial match', async () => {
            const mockBooks: Book[] = [
                {
                    ID: '1',
                    Author: 'John Doe',
                    Title: 'Test Book',
                    Language: 'English',
                    Mirror_1: 'http://example.com'
                },
                {
                    ID: '2',
                    Author: 'John Smith',
                    Title: 'Another Book',
                    Language: 'English',
                    Mirror_1: 'http://example.com'
                }
            ];

            jest.spyOn(libgen as any, 'searchAuthor').mockResolvedValue(mockBooks);

            const results = await libgen.searchAuthorFiltered('John', { Language: 'English' }, false);
            expect(results).toHaveLength(2);
            expect(results[0].Language).toBe('English');
            expect(results[1].Language).toBe('English');
        });
    });

    describe('resolveDownloadLinks', () => {
        it('should resolve download links for a book with multiple mirrors', async () => {
            const mockBook: Book = {
                ID: '411609',
                Author: 'Steve Hockensmith',
                Title: 'Pride and Prejudice and Zombies: Dawn of the Dreadfuls',
                Language: 'English',
                Extension: 'epub',
                Mirror_1: 'http://books.ms/main/7986BD49BC82CECFACF962CBC7DEAA3D',
                Mirror_2: 'http://libgen.li/ads.php?md5=7986BD49BC82CECFACF962CBC7DEAA3D',
                Mirror_3: 'https://library.bz/main/edit/7986BD49BC82CECFACF962CBC7DEAA3D'
            };

            const mockResponse = {
                data: `
                    <div>
                        <a href="https://download.books.ms/main/411000/7986bd49bc82cecfacf962cbc7deaa3d/Steve%20Hockensmith%20-%20Pride%20and%20Prejudice%20and%20Zombies_%20Dawn%20of%20the%20Dreadfuls%20%28Quirk%20Classics%29%20%282010%29.epub">GET</a>
                    </div>
                `
            };

            mockAxios.get.mockResolvedValueOnce(mockResponse);
            
            // Create a mock cheerio instance that properly handles the selector chain
            const mockCheerioInstance = {
                find: jest.fn().mockReturnThis(),
                attr: jest.fn().mockImplementation((attr) => {
                    if (attr === 'href') {
                        return 'https://download.books.ms/main/411000/7986bd49bc82cecfacf962cbc7deaa3d/Steve%20Hockensmith%20-%20Pride%20and%20Prejudice%20and%20Zombies_%20Dawn%20of%20the%20Dreadfuls%20%28Quirk%20Classics%29%20%282010%29.epub';
                    }
                    return null;
                }),
                text: jest.fn().mockReturnValue('GET')
            };
            mockCheerio.load.mockReturnValue(mockCheerioInstance);

            const links = await libgen.resolveDownloadLinks(mockBook);
            expect(links).toHaveProperty('GET');
            expect(links['GET']).toBe('https://download.books.ms/main/411000/7986bd49bc82cecfacf962cbc7deaa3d/Steve%20Hockensmith%20-%20Pride%20and%20Prejudice%20and%20Zombies_%20Dawn%20of%20the%20Dreadfuls%20%28Quirk%20Classics%29%20%282010%29.epub');
            expect(mockAxios.get).toHaveBeenCalledWith(mockBook.Mirror_1);
        });

        it('should handle failed mirror resolution', async () => {
            const mockBook: Book = {
                ID: '1',
                Author: 'John Doe',
                Title: 'Test Book',
                Mirror_1: 'http://invalid.example.com'
            };

            mockAxios.get.mockRejectedValue(new Error('Failed to resolve download links'));

            await expect(libgen.resolveDownloadLinks(mockBook)).rejects.toThrow('Failed to resolve download links');
        });
    });

    describe('getFilters', () => {
        it('should return available filters', () => {
            const filters = libgen.getFilters();
            expect(filters).toContain('Language');
            expect(filters).toContain('Extension');
            expect(filters).toContain('Year');
            expect(filters).toContain('Publisher');
        });
    });
}); 