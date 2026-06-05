import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import {
  FilterProvider
} from './context/FilterContext'

import Layout from './components/Layout/Layout'

import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Analytics from './pages/Analytics'
import Counselors from './pages/Counselors'
import Recommendations from './pages/Recommendations'

export default function App() {
  return (
    <FilterProvider>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/students"
            element={<Students />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/counselors"
            element={<Counselors />}
          />

          <Route
            path="/recommendations"
            element={<Recommendations />}
          />
        </Routes>
      </Layout>
    </FilterProvider>
  )
}