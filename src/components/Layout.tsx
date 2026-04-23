export function Layout({ title, children }: { title: string; children: JSX.Element }) {
  return (
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/public/output.css" />
      </head>
      <body class="bg-gray-50 text-gray-900 min-h-screen p-6">{children}</body>
    </html>
  );
}
