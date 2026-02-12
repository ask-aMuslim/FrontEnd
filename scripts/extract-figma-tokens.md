# Figma Design Token Extraction Guide

## Using Figma MCP Server

Once the Figma MCP server is configured (see `docs/FIGMA_MCP_SETUP.md`), you can extract design tokens using these MCP tools.

## Step 1: Extract Design Tokens

### Colors
```
Use Figma MCP get_variable_defs tool to extract color tokens from [Figma File URL]
Filter by type: color
```

### Typography
```
Use Figma MCP get_variable_defs tool to extract typography tokens from [Figma File URL]
Filter by type: typography
```

### Spacing
```
Use Figma MCP get_variable_defs tool to extract spacing tokens from [Figma File URL]
Filter by type: spacing
```

## Step 2: Sync Tokens to Project

After extracting tokens, update these files:

1. **`tokens/colors.json`** - Add/extend color tokens
2. **`tokens/typography.json`** - Add/extend typography tokens  
3. **`tokens/numbers.json`** - Add spacing, border radius, etc.
4. **`tailwind.config.js`** - Map tokens to Tailwind theme
5. **`src/styles/_tokens.scss`** - Add SCSS variables if needed

## Example Token Structure

### Colors (tokens/colors.json)
```json
{
  "colors": {
    "primary": {
      "50": { "$type": "color", "$value": "#e8f4e8" },
      "100": { "$type": "color", "$value": "#d1e9d1" },
      ...
    }
  }
}
```

### Typography (tokens/typography.json)
```json
{
  "typography": {
    "heading": {
      "fontFamily": { "$type": "string", "$value": "Inter" },
      "fontSize": { "$type": "number", "$value": 24 },
      "fontWeight": { "$type": "number", "$value": 700 },
      "lineHeight": { "$type": "number", "$value": 32 }
    }
  }
}
```

## Step 3: Update Tailwind Config

Map extracted tokens to Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Map from tokens/colors.json
        primary: {
          50: 'var(--color-primary-50)',
          // ... etc
        }
      },
      fontFamily: {
        // Map from tokens/typography.json
        heading: ['var(--font-heading-family)'],
      },
      spacing: {
        // Map from tokens/numbers.json
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        // ... etc
      }
    }
  }
}
```

## Step 4: Generate CSS Variables

Run the style dictionary build:
```bash
npm run build:tokens
```

This generates CSS variables from your token files.

## Component Mapping

Use Code Connect to map Figma components:

```
Use Figma MCP get_code_connect_map to get component mappings from [Figma File URL]
```

Then implement Angular components matching Figma specifications.
