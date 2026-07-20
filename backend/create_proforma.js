async function createInvoice() {
  try {
    // 1. Get next quotation no
    const resNo = await fetch('http://localhost:5000/api/quotations/next-no');
    const { nextNo } = await resNo.json();
    
    // 2. Get private materials
    const resMats = await fetch('http://localhost:5000/api/master-data/private-materials');
    const materials = await resMats.json();
    
    // 3. Create items array
    const items = materials.map((m, index) => ({
      id: Date.now() + index,
      description: m.name,
      hsn: '8538',
      quantity: 1,
      unit: 'Nos',
      rate: 150.00,
      amount: 150.00
    }));

    const subTotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = subTotal * 0.18;
    const totalAmount = subTotal + taxAmount;

    const payload = {
      quotationNo: nextNo,
      date: new Date().toISOString().split('T')[0],
      clientName: "Demo Client",
      companyName: "Demo Industrial Solutions",
      clientEmail: "demo@example.com",
      clientPhone: "9876543210",
      clientAddress: "123 Industrial Estate, Mumbai",
      clientGST: "27AABCU9603R1ZN",
      documentType: "Proforma Invoice",
      subject: "Supply of Materials",
      items: items,
      taxPercentage: 18,
      terms: "1. Payment: Full payment must be completed immediately upon delivery.\n2. Taxes: As applicable and mentioned in the estimate.",
      status: "Draft",
      subTotal: subTotal,
      taxAmount: taxAmount,
      totalAmount: totalAmount
    };

    const res = await fetch('http://localhost:5000/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Invoice created with ID:", data._id);
  } catch (error) {
    console.error("Error creating invoice:", error.message);
  }
}

createInvoice();
