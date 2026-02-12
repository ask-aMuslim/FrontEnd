# Figma MCP Server Setup Guide

## Overview
This guide explains how to configure the Figma MCP (Model Context Protocol) server to extract design tokens and components from Figma designs.

## Prerequisites
- Figma API Token: `figd_uxYGmAsQgor_taJmIv-fo5OLZaBgQS1KBeQ_nJtC` (stored in `.env.local`)
- Cursor IDE with MCP support

## Configuration Steps

### Option 1: Using Cursor UI (Recommended)
1. Open Cursor → Settings → Cursor Settings
2. Navigate to the **MCP** tab
3. Click **+ Add new global MCP server**
4. Configure with the following:
   - **Name**: `figma`
   - **Command**: `npx -y @modelcontextprotocol/server-figma`
   - **Environment Variables**:
     - `FIGMA_API_TOKEN`: `figd_uxYGmAsQgor_taJmIv-fo5OLZaBgQS1KBeQ_nJtC`

### Option 2: Manual Configuration
Add to your Cursor MCP settings file (typically `~/.cursor/mcp.json` or workspace `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_API_TOKEN": "figd_uxYGmAsQgor_taJmIv-fo5OLZaBgQS1KBeQ_nJtC"
      }
    }
  }
}
```

## Available MCP Tools

Once configured, you can use these tools:

1. **get_design_context** - Extract design context from Figma frames
2. **get_variable_defs** - Get design tokens (colors, typography, spacing)
3. **get_code_connect_map** - Map Figma components to code components
4. **get_code_connect_suggestions** - Get suggestions for component mapping

## Usage Examples

### Extract Design Tokens
```
Use Figma MCP to extract design tokens from [Figma File URL]
```

### Get Component Specifications
```
Get design context for [Component Name] from Figma
```

### Map Components
```
Map Figma component [Component Name] to Angular component [ComponentPath]
```

## Design Token Extraction Workflow

1. Open your Figma design file
2. Use MCP `get_variable_defs` to extract:
   - Colors (primary, secondary, semantic colors)
   - Typography (font families, sizes, weights, line heights)
   - Spacing (margins, paddings, gaps)
   - Border radius, shadows, effects
3. Sync extracted tokens to `tokens/` directory
4. Update `tailwind.config.js` with new tokens
5. Update `src/styles/_tokens.scss` if using SCSS

## Code Connect Integration

For seamless Figma-to-code workflow:

1. Set up Code Connect in your Figma file
2. Map Figma components to Angular components
3. Use MCP `get_code_connect_map` to retrieve mappings
4. Generate component stubs using Figma properties

## Troubleshooting

- **Token not working**: Regenerate token from Figma Settings → Security → Personal Access Tokens
- **MCP server not connecting**: Ensure `npx` is available and network allows npm registry access
- **No design context**: Verify Figma file URL is accessible and you have view permissions

## Next Steps

After setup:
1. Extract design tokens from your Figma designs
2. Sync tokens to `tokens/` directory
3. Update Tailwind config with extracted values
4. Map Figma components to Angular components
5. Implement components following Figma specifications
