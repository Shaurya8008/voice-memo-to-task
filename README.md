# Voice Memo to Task

A Next.js + TypeScript application that converts voice memos into actionable tasks.

## Features

- Record voice memos
- Transcribe speech to text
- Convert transcriptions into tasks
- Mark tasks as complete
- Dark mode support
- Responsive design

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [React 18](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling (optional, but recommended)
- [PostgreSQL](https://www.postgresql.org/) - Database (schema provided)

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up the database:
   - Create a PostgreSQL database
   - Run the schema in `database_schema.sql`
   - Set environment variables in `.env.local` (see below)

4. Configure environment variables:
   Create a `.env.local` file in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
NEXTAUTH_SECRET="your-secret-key"
# Add any other required keys (e.g., for transcription service)
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app` - Next.js app directory (pages, layouts, etc.)
- `src/types` - TypeScript type definitions
- `database_schema.sql` - SQL schema for PostgreSQL

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.