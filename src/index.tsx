import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h3>Hello!</h3>)
})

app.get('/protected', (c) => {
  return c.render(<h3>Protected Page</h3>)
})

export default app
