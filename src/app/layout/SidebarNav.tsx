import { Link } from '@tanstack/react-router'

export function SidebarNav() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Search</Link>
        </li>
        <li>
          <Link to="/collections">Collections</Link>
        </li>
      </ul>
    </nav>
  )
}
