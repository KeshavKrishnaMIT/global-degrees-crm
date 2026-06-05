import { useState, useEffect, useCallback } from 'react'
import {
  analyticsAPI,
  counselorsAPI
} from '../services/api'

export function useAnalytics() {

  const [summary, setSummary] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  useEffect(() => {

    analyticsAPI
      .getSummary()
      .then(data => {
        setSummary(data)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [])

  return {
    summary,
    loading,
    error
  }
}

export function useCounselors() {

  const [data, setData] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  useEffect(() => {

    counselorsAPI
      .getAll()
      .then(res => {
        setData(res)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [])

  return {
    data,
    loading,
    error
  }
}

export function useRefreshAnalytics() {

  const refresh =
    useCallback(async () => {

      return await analyticsAPI
        .getSummary()

    }, [])

  return {
    refresh
  }
}