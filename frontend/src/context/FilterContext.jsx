import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from 'react'

const FilterContext = createContext(null)

const DEFAULT_FILTERS = {
  country: '',
  course: '',
  counselor: '',
  budgetMin: '',
  budgetMax: '',
  ieltsMin: '',
  ieltsMax: '',
  cgpaMin: '',
  cgpaMax: '',
  leadSource: '',
  status: '',
  scholarshipRequired: '',
  dateFrom: '',
  dateTo: '',
  search: ''
}

export function FilterProvider({ children }) {

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS)

  const [isFilterPanelOpen,
    setIsFilterPanelOpen] =
    useState(false)

  const updateFilter =
    useCallback((key, value) => {

      setFilters(prev => ({
        ...prev,
        [key]: value
      }))

    }, [])

  const updateFilters =
    useCallback((newFilters) => {

      setFilters(prev => ({
        ...prev,
        ...newFilters
      }))

    }, [])

  const resetFilters =
    useCallback(() => {

      setFilters(DEFAULT_FILTERS)

    }, [])

  const activeFilterCount =
    Object.values(filters)
      .filter(v => v !== '')
      .length

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        updateFilters,
        resetFilters,
        activeFilterCount,
        isFilterPanelOpen,
        setIsFilterPanelOpen
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {

  const context =
    useContext(FilterContext)

  if (!context) {
    throw new Error(
      'useFilters must be used inside FilterProvider'
    )
  }

  return context
}