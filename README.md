# Library Genesis MCP Server

A Model Context Protocol (MCP) server that provides tools for searching and accessing books from Library Genesis.

## Features

- Search books by title
- Search books by author
- Get download links for books
- Filter search results by various criteria

## Available Tools

### Search by Title

- Tool name: `search_by_title`
- Parameters:
  - `query`: String (minimum 3 characters)
  - `filters`: Optional record of filter criteria
  - `exact_match`: Boolean (default: true)

### Search by Author

- Tool name: `search_by_author`
- Parameters:
  - `query`: String (minimum 3 characters)
  - `filters`: Optional record of filter criteria
  - `exact_match`: Boolean (default: true)

### Get Download Links

- Tool name: `get_download_links`
- Parameters:
  - `book`: Object containing book metadata (ID, Author, Title, etc.)

### Get Available Filters

- Tool name: `get_available_filters`
- Returns a list of available filter criteria

## Filter Criteria

The following filters are available for search operations:

- ID: Book ID
- Author: Author name
- Title: Book title
- Publisher: Publisher name
- Year: Publication year
- Pages: Number of pages
- Language: Book language
- Size: File size
- Extension: File format

## Connect Claude Desktop to your MCP server

Run:

```bash
npm install && npm run dev
```

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available.

## Test

```bash
NODE_OPTIONS=--experimental-vm-modules npm test
```
