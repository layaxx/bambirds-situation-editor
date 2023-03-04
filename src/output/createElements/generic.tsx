import jsx from "texsaur"

export const generic = (
  tag: JSX.HTMLTag,
  ...children: Array<Node | string>
) => {
  return jsx(tag, {}, ...(children as Node[]))
}

export const button = (text: string, clickHandler?: (ev: Event) => any) => {
  return jsx(
    "button",
    {
      onclick(ev: Event) {
        if (typeof clickHandler === "function") clickHandler(ev)
      },
    } as any,
    text as unknown as Node
  )
}
