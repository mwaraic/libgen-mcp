import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LibgenSearch } from "./utils/libgen.ts";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Library Genesis",
		version: "1.0.0",
	});

	private readonly libgen = new LibgenSearch();
	
	async init() {
		// Search books by title
		this.server.tool(
			"search_by_title",
			{
				query: z.string().min(3),
				filters: z.record(z.string()).optional(),
				exact_match: z.boolean().optional().default(true)
			},
			async ({ query, filters, exact_match }) => {
				console.log("Searching for books by title:", query);
				try {
					const results = await this.libgen.searchTitleFiltered(query, filters || {}, exact_match);
					return {
						content: [{ 
							type: "text", 
							text: JSON.stringify(results, null, 2)
						}]
					};
				} catch (error) {
					return {
						content: [{ 
							type: "text", 
							text: `Error searching by title: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Search books by author
		this.server.tool(
			"search_by_author",
			{
				query: z.string().min(3),
				filters: z.record(z.string()).optional(),
				exact_match: z.boolean().optional().default(true)
			},
			async ({ query, filters, exact_match }) => {
				try {
					const results = await this.libgen.searchAuthorFiltered(query, filters || {}, exact_match);
					return {
						content: [{ 
							type: "text", 
							text: JSON.stringify(results, null, 2)
						}]
					};
				} catch (error) {
					return {
						content: [{ 
							type: "text", 
							text: `Error searching by author: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Get download links
		this.server.tool(
			"get_download_links",
			{
				book: z.object({
					ID: z.string(),
					Author: z.string(),
					Title: z.string(),
					Publisher: z.string().optional(),
					Year: z.string().optional(),
					Pages: z.string().optional(),
					Language: z.string().optional(),
					Size: z.string().optional(),
					Extension: z.string().optional(),
					Mirror_1: z.string(),
					Mirror_2: z.string().optional(),
					Mirror_3: z.string().optional(),
					Mirror_4: z.string().optional(),
					Mirror_5: z.string().optional(),
					Edit: z.string().optional()
				})
			},
			async ({ book }) => {
				try {
					const links = await this.libgen.resolveDownloadLinks(book);
					return {
						content: [{ 
							type: "text", 
							text: JSON.stringify(links, null, 2)
						}]
					};
				} catch (error) {
					return {
						content: [{ 
							type: "text", 
							text: `Error getting download links: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Get available filters
		this.server.tool(
			"get_available_filters",
			{},
			async () => {
				const filters = {
					"ID": "Book ID",
					"Author": "Author name",
					"Title": "Book title",
					"Publisher": "Publisher name",
					"Year": "Publication year",
					"Pages": "Number of pages",
					"Language": "Book language",
					"Size": "File size",
					"Extension": "File format"
				};
				return {
					content: [{ 
						type: "text", 
						text: JSON.stringify(filters, null, 2)
					}]
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
