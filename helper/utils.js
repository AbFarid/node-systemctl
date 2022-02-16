export const sleep = ms => new Promise(r => setTimeout(r, ms))

export const capitalize = s => (s && s[0].toUpperCase() + s.slice(1)) || ""
export const uncapitalize = s => (s && s[0].toLowerCase() + s.slice(1)) || ""