import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import {
  FilterProvider
} from './context/FilterContext'

import Layout from './components/Layout/Layout'

import Dashboard from './pages/dashboard'
import Students from './pages/students'
import Analytics from './pages/analytics'
import Counselors from './pages/counselors'
import Recommendations from './pages/recommendations'

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