import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import {
  FilterProvider
} from './context/FilterContext'

import Layout from './components/Layout/Layout'

import dashboard from './pages/dashboard'
import students from './pages/students'
import analytics from './pages/analytics'
import counselors from './pages/counselors'
import recommendations from './pages/recommendations'

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