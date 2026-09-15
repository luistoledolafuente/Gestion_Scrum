export const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
export const mondayOf = (date) => { const copy = startOfDay(date); const day = copy.getDay() || 7; return addDays(copy, 1 - day) }
