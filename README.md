# Ask A Muslim

Ask A Muslim is a modern, authoritative, and respectful digital platform designed to bridge the gap between curiosity and credible Islamic knowledge. It provides a serene environment for individuals to seek reliable answers about Islamic practices, beliefs, and theology, while also offering essential resources for finding and interacting with local mosques.

## 🌟 Key Features

- **Knowledge Hub**: A welcoming space for Muslims and non-Muslims to get clear, credible answers to theological and practical questions.
- **Mosque Discovery**: Rapid access to local mosque resources, including:
  - Daily prayer timings.
  - Friday sermon details.
  - Mosque facilities (e.g., women's prayer areas).
  - Integrated maps and contact information.
- **Scholar Tools**: Organized management interfaces for Scholars and Imams to provide guidance and maintain mosque data.
- **Modern Experience**: A highly polished, accessible UI focused on cognitive clarity and tranquility.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Angular](https://angular.io/) (v20.3.17)
- **State Management & Logic**: RxJS
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4.1.17) & PostCSS
- **Animations**: [GSAP](https://greensock.com/gsap/)
- **UI Components**: Flowbite
- **Mapping**: [Leaflet](https://leafletjs.com/)
- **Rich Text Editing**: [Tiptap](https://tiptap.dev/)
- **Icons**: [FontAwesome](https://fontawesome.com/) (v7.1.0)
- **Rendering**: Angular SSR (Server-Side Rendering)

### Tooling & Infrastructure
- **API Generation**: `ng-openapi-gen` (OpenAPI/Swagger)
- **Design Tokens**: `style-dictionary`
- **Testing**: [Playwright](https://playwright.dev/), Jasmine & Karma
- **Deployment**: Netlify

## 🎨 Design Philosophy

The platform adheres to a visual language of **Reverence**, **Credibility**, and **Welcoming**.

- **Color Palette**:
  - **Primary**: `#156b40` (Rich Forest Green) - Evoking peace and tradition.
  - **Secondary**: `#ecc140` (Warm Islamic Gold) - Providing elegant accents.
  - **Surfaces**: Clean whites and soft green-tinted neutrals.
- **Typography**:
  - **English**: Poppins
  - **Arabic**: IBM Plex Sans Arabic
- **Principles**: Balanced spacing, dignified typography, and strict adherence to WCAG AA accessibility standards.

## 🚀 Getting Started

### Prerequisites
- Node.js (Check `.node-version` for specific version)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AskAMuslim
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.local` or `.env` and fill in the required values.

### Development
Run the application in development mode:
```bash
npm start
```

### Testing
Run unit tests:
```bash
npm test
```
Run CI tests:
```bash
npm run test:ci
```

### Build
Build for production:
```bash
npm run build
```

## 📁 Project Structure

- `src/`: Application source code.
- `public/`: Static assets.
- `scripts/`: Custom build and automation scripts.
- `specs/`: Test specifications.
- `docs/`: Project documentation.
- `PRODUCT.md`: Strategic product definition and user personas.
- `DESIGN.md`: Visual design system and tokens.

## 📄 License
This project is licensed under the terms specified in the `LICENSE` file.
