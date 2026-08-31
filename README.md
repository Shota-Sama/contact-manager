This project has a Next.js frontend and an ASP.NET Core backend in `ContactManager.Api`.

## Getting Started

First, configure and run the .NET API as described in [`ContactManager.Api/README.md`](ContactManager.Api/README.md). Then copy `.env.example` to `.env.local` and set a strong `AUTH_SECRET`.

Run the frontend:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend calls its own route handlers, which securely proxy signup, login, and contact requests to the .NET API.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses a system font stack, so its production build does not depend on downloading fonts from an external service.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
