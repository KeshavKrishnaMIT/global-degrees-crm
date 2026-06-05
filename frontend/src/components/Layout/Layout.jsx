import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import GlobalFilters from '../Filters/GlobalFilters'
import { useFilters } from '../../context/FilterContext'

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  const {
    isFilterPanelOpen
  } = useFilters()

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-void)'
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() =>
          setCollapsed(!collapsed)
        }
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Navbar />

        <main
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto'
          }}
        >
          {children}
        </main>
      </div>

      {isFilterPanelOpen && (
        <GlobalFilters />
      )}
    </div>
  )
}