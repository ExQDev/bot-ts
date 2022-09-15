import Mustache from 'mustache'

export type RenderOptions = {
  [key: string]: string
}

export default function renderString (input: string, params: RenderOptions): string {
  return Mustache.render(input, params)
}