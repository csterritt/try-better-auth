import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link
          rel='stylesheet'
          href='https://yarnpkg.com/en/package/normalize.css'
          type='text/css'
        />
        <link
          rel='stylesheet'
          href='https://unpkg.com/sakura.css/css/sakura.css'
          type='text/css'
        />
      </head>
      <body>{children}</body>
    </html>
  )
})
