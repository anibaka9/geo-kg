export function Layout({
  title,
  children,
  headExtra,
}: {
  title: string;
  children: JSX.Element;
  headExtra?: JSX.Element;
}) {
  return (
    <html lang="ru" class="overflow-hidden">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/public/output.css" />
        <script type="module" src="/public/turbo.js" />
        {headExtra}
      </head>
      <body class="bg-background text-foreground h-screen overflow-hidden">
        <div class="px-3 py-4 sm:px-6 sm:py-8 h-full mx-auto">{children}</div>
      </body>
    </html>
  );
}
