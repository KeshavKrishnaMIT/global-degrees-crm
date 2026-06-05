import { useState, useEffect, useCallback } from 'react'
import { studentsAPI } from '../services/api'

export function useStudents() {

  const [students, setStudents] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  const fetchStudents =
    useCallback(async () => {

      try {

        setLoading(true)
        setError(null)

        const data =
          await studentsAPI.getStudents()

        setStudents(data || [])

      } catch (err) {

        setError(err.message)

      } finally {

        setLoading(false)

      }

    }, [])

  useEffect(() => {

    fetchStudents()

  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    refetch: fetchStudents
  }
}

export function useHotLeads() {

  const [leads, setLeads] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  const fetchLeads =
    useCallback(async () => {

      try {

        setLoading(true)

        const data =
          await studentsAPI.getHotLeads()

        setLeads(data || [])

      } catch (err) {

        setError(err.message)

      } finally {

        setLoading(false)

      }

    }, [])

  useEffect(() => {

    fetchLeads()

  }, [fetchLeads])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads
  }
}