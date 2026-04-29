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
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/public/output.css" />
        {headExtra}
      </head>
      <body class="bg-background text-foreground min-h-screen">
        <div class="px-6 py-8 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
