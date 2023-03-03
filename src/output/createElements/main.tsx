import jsx from "texsaur"

export const main: JSX.Component<{ children: any } | undefined> = (
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  { children } = { children: undefined }
) => {
  return <main class="container">{children}</main>
}
