// Helper method to convert date formats
export function formatDateForInput(dateString?: string): string {
  if (!dateString) return "";

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Convert from MM/DD/YYYY to YYYY-MM-DD
  if (dateString.includes("/")) {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Return original if format is unknown
  return dateString;
}

export function formatDateForDisplay(dateString?: string): string {
  if (!dateString) return "";
  // Normalize known formats to DD/MM/YYYY for display

  // If in YYYY-MM-DD (or YYYY-M-D) format -> DD/MM/YYYY
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // If in a slash format (could be MM/DD/YYYY or DD/MM/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [p1, p2, year] = dateString.split("/");
    const n1 = parseInt(p1, 10);
    // If first part > 12 it's very likely DD/MM/YYYY already
    if (n1 > 12) {
      return `${p1.padStart(2, "0")}/${p2.padStart(2, "0")}/${year}`;
    }
    // Otherwise assume MM/DD/YYYY and swap to DD/MM/YYYY
    return `${p2.padStart(2, "0")}/${p1.padStart(2, "0")}/${year}`;
  }

  // Fallback: try Date parser (ISO, RFC, etc.)
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Unknown format, return original
  return dateString;
}
