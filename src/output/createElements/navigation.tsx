import jsx from "texsaur"

export const navigation: JSX.Component<{ active: string }> = ({ active }) => {
  const links = [
    { name: "Home", destination: "/" },
    { name: "Levels", destination: "/levels.html" },
    { name: "Knowledge", destination: "/knowledge.html" },
    { name: "Analysis", destination: "/analysis.html" },
  ]

  return (
    <nav>
      <ul>
        {links.map((link) => (
          <li>
            {link.destination === active ? (
              link.name
            ) : (
              <a href={link.destination}>{link.name}</a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
