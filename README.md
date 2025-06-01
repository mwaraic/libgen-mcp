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
    "libgen": {
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.