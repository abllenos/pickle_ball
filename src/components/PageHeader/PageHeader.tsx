import type { ReactNode } from 'react'
import './PageHeader.css'

type PageHeaderProps = {
  title: string
  eyebrow?: string
  action?: ReactNode
}

export function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1 className="page-header__title">{title}</h1>
      </div>
      {action}
    </header>
  )
}
