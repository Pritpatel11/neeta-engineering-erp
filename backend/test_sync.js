(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/enquiries/sync', {
      method: 'POST',
      headers: { 'x-financial-year': '2025-26', 'Content-Type': 'application/json' }
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.error(err.message);
  }
})();
