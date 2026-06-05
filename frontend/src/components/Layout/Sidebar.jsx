import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  Lightbulb,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  {
    group: 'OVERVIEW',
    items: [
      {
        path: '/',
        label: 'Executive Dashboard',
        icon: LayoutDashboard,
        exact: true
      }
    ]
  },
  {
    group: 'DATA',
    items: [
      {
        path: '/students',
        label: 'Student Explorer',
        icon: Users
      },
      {
        path: '/counselors',
        label: 'Counselors',
        icon: UserCheck
      }
    ]
  },
  {
    group: 'INTELLIGENCE',
    items: [
      {
        path: '/analytics',
        label: 'Analytics Hub',
        icon: BarChart3
      },
      {
        path: '/recommendations',
        label: 'AI Recommendations',
        icon: Lightbulb
      }
    ]
  }
]

export default function Sidebar({
  collapsed,
  onToggle
}) {
  const location = useLocation()

  return (
    <aside
      style={{
        width: collapsed
          ? 'var(--sidebar-collapsed)'
          : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #dbe3ed',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all .25s ease',
        overflow: 'visible',
        position: 'relative',
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        zIndex: 20
      }}
    >
      <div
        style={{
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: collapsed
            ? '0 14px'
            : '0 22px',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        {/* LOGO */}

 <img
  src="/gd-logo.png"
  alt="Global Degrees"
  style={{
    width: collapsed ? 50 : 180,
    height: collapsed ? 50 : 120,
    objectFit: 'contain',
    flexShrink: 0,
    display: 'block',
    margin: '0 auto'
  }}
/>

   
      </div>

      <nav
        style={{
          flex: 1,
          padding: '20px 0'
        }}
      >
        {NAV_ITEMS.map(group => (
          <div
            key={group.group}
            style={{
              marginBottom: 20
            }}
          >
            {!collapsed && (
              <div
                style={{
                  padding: '0 24px',
                  marginBottom: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '1px'
                }}
              >
                {group.group}
              </div>
            )}

            {group.items.map(item => (
              <SidebarItem
                key={item.path}
                item={item}
                collapsed={collapsed}
                active={
                  item.exact
                    ? location.pathname ===
                      item.path
                    : location.pathname.startsWith(
                        item.path
                      )
                }
              />
            ))}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div
          style={{
            margin: 16,
            padding: 16,
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#16a34a'
              }}
            />

            <span
              style={{
                color: '#16a34a',
                fontWeight: 700,
                fontSize: 13
              }}
            >
              LIVE DATA
            </span>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#475569'
            }}
          >
            5,000+ Student Records
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 26,
          right: -14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#334155',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}
      >
        {collapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronLeft size={14} />
        )}
      </button>
    </aside>
  )
}

function SidebarItem({
  item,
  collapsed,
  active
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: collapsed
          ? '14px 20px'
          : '14px 22px',
        margin: '4px 10px',
        borderRadius: 12,
        textDecoration: 'none',
        background: active
          ? '#e8f0ff'
          : 'transparent',
        color: active
          ? '#2563eb'
          : '#334155',
        fontWeight: active
          ? 700
          : 500,
        transition: '.2s'
      }}
    >
      <Icon
        size={20}
        strokeWidth={2}
        style={{
          flexShrink: 0
        }}
      />

      {!collapsed && (
        <span
          style={{
            fontSize: 15
          }}
        >
          {item.label}
        </span>
      )}
    </NavLink>
  )
}