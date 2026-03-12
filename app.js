/**
 * Medical Bill Generator App - Shree Vighnaharta Medico
 * A mobile-first web application for generating medical bills quickly
 */

// Fixed Store Details
const STORE_INFO = {
    name: 'SHREE VIGHNAHARTA MEDICO & DISTRIBUTORS',
    address: 'Godrej Green Cave, T/10, Near Mahalunge Circle, Mahalunge, Pune 411045',
    phone: '+91 9326361657',
    gst: '',
    license: 'Lic No: 21525038000360'
};

// DOM Elements
const billForm = document.getElementById('billForm');
const medicineBody = document.getElementById('medicineBody');
const addRowBtn = document.getElementById('addRowBtn');
const subtotalAmountEl = document.getElementById('subtotalAmount');
const discountAmountEl = document.getElementById('discountAmount');
const totalAmountEl = document.getElementById('totalAmount');
const afterDiscountAmountEl = document.getElementById('afterDiscountAmount');
const cashDiscountEl = document.getElementById('cashDiscount');
const roundOffEl = document.getElementById('roundOff');
const generatePdfBtn = document.getElementById('generatePdfBtn');
const printBtn = document.getElementById('printBtn');
const whatsappBtn = document.getElementById('whatsappBtn');
const clearBtn = document.getElementById('clearBtn');
const newBillBtn = document.getElementById('newBillBtn');
const toast = document.getElementById('toast');

// App State
let billNumber = localStorage.getItem('lastBillNo') 
    ? parseInt(localStorage.getItem('lastBillNo')) + 1 
    : 1;
let generatedPdfBlob = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    attachEventListeners();
    registerServiceWorker();
});

/**
 * Initialize form with default values
 */
function initializeForm() {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('billDate').value = today;
    
    // Set bill number
    document.getElementById('billNo').value = billNumber;
    
    // Add initial medicine row event listeners
    const firstRow = medicineBody.querySelector('.medicine-row');
    if (firstRow) {
        attachRowEventListeners(firstRow);
    }
    
    // Update serial numbers
    updateSerialNumbers();
}
function attachEventListeners() {
    // Add row button
    if (addRowBtn) addRowBtn.addEventListener('click', addMedicineRow);
    
    // Action buttons
    if (generatePdfBtn) generatePdfBtn.addEventListener('click', generatePDF);
    if (printBtn) printBtn.addEventListener('click', printBill);
    if (whatsappBtn) whatsappBtn.addEventListener('click', shareToWhatsApp);
    if (clearBtn) clearBtn.addEventListener('click', clearForm);
    if (newBillBtn) newBillBtn.addEventListener('click', newBill);
    
    // Total fields change listeners
    if (cashDiscountEl) cashDiscountEl.addEventListener('input', updateTotal);
    if (roundOffEl) roundOffEl.addEventListener('input', updateTotal);
}

/**
 * Attach event listeners to a medicine row
 */
function attachRowEventListeners(row) {
    const priceInput = row.querySelector('.medicine-price');
    const qtyInput = row.querySelector('.medicine-qty');
    const discountInput = row.querySelector('.medicine-discount');
    const nameInput = row.querySelector('.medicine-name');
    const removeBtn = row.querySelector('.btn-remove-row');
    
    // Update amount on price, qty, or discount change
    const updateRowAmount = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        
        const subtotal = qty * price;
        const discountAmt = subtotal * (discount / 100);
        const amount = subtotal - discountAmt;
        
        row.querySelector('.row-amount').textContent = amount.toFixed(2);
        updateTotal();
    };
    
    priceInput.addEventListener('input', updateRowAmount);
    qtyInput.addEventListener('input', updateRowAmount);
    discountInput.addEventListener('input', updateRowAmount);
    
    // Navigate to discount on price entry
    priceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            discountInput.focus();
        }
    });
    
    // Auto-add new row when discount is entered
    discountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const rows = Array.from(medicineBody.querySelectorAll('.medicine-row'));
            const currentIndex = rows.indexOf(row);
            
            if (currentIndex === rows.length - 1) {
                addMedicineRow();
                setTimeout(() => {
                    const newRow = medicineBody.lastElementChild;
                    newRow.querySelector('.medicine-name').focus();
                }, 50);
            } else {
                rows[currentIndex + 1].querySelector('.medicine-name').focus();
            }
        }
    });
    
    // Remove row button
    removeBtn.addEventListener('click', () => {
        const rows = medicineBody.querySelectorAll('.medicine-row');
        if (rows.length > 1) {
            row.remove();
            updateSerialNumbers();
            updateTotal();
        } else {
            showToast('At least one row is required', 'error');
        }
    });
    
    // Quick navigation between fields
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            qtyInput.focus();
        }
    });
    
    qtyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            priceInput.focus();
        }
    });
}

/**
 * Add a new medicine row
 */
function addMedicineRow() {
    const rowCount = medicineBody.querySelectorAll('.medicine-row').length;
    const newRow = document.createElement('tr');
    newRow.className = 'medicine-row';
    newRow.innerHTML = `
        <td class="col-sr">${rowCount + 1}</td>
        <td class="col-qty">
            <input type="number" class="medicine-qty" placeholder="1" min="1" value="1">
        </td>
        <td class="col-name">
            <input type="text" class="medicine-name" placeholder="Medicine name">
        </td>
        <td class="col-price">
            <input type="number" class="medicine-price" placeholder="0" min="0" step="0.01">
        </td>
        <td class="col-discount">
            <input type="number" class="medicine-discount" placeholder="0" min="0" max="100" value="0">
        </td>
        <td class="col-amount">
            <span class="row-amount">0.00</span>
        </td>
        <td class="col-action">
            <button type="button" class="btn-remove-row" title="Remove">×</button>
        </td>
    `;
    
    medicineBody.appendChild(newRow);
    attachRowEventListeners(newRow);
    
    // Focus on the new medicine name input
    newRow.querySelector('.medicine-name').focus();
}

/**
 * Update serial numbers for all rows
 */
function updateSerialNumbers() {
    const rows = medicineBody.querySelectorAll('.medicine-row');
    rows.forEach((row, index) => {
        row.querySelector('.col-sr').textContent = index + 1;
    });
}

/**
 * Calculate and update total amount
 */
function updateTotal() {
    const rows = medicineBody.querySelectorAll('.medicine-row');
    let subtotal = 0;
    let totalDiscount = 0;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.medicine-qty').value) || 0;
        const price = parseFloat(row.querySelector('.medicine-price').value) || 0;
        const discount = parseFloat(row.querySelector('.medicine-discount').value) || 0;
        
        const rowSubtotal = qty * price;
        const rowDiscount = rowSubtotal * (discount / 100);
        
        subtotal += rowSubtotal;
        totalDiscount += rowDiscount;
    });
    
    const afterDiscount = subtotal - totalDiscount;
    const cashDiscount = parseFloat(cashDiscountEl.value) || 0;
    const roundOff = parseFloat(roundOffEl.value) || 0;
    const grandTotal = afterDiscount - cashDiscount + roundOff;
    
    subtotalAmountEl.textContent = subtotal.toFixed(2);
    discountAmountEl.textContent = totalDiscount.toFixed(2);
    if (afterDiscountAmountEl) afterDiscountAmountEl.textContent = afterDiscount.toFixed(2);
    totalAmountEl.textContent = grandTotal.toFixed(2);
}

/**
 * Get all form data
 */
function getFormData() {
    const medicines = [];
    const rows = medicineBody.querySelectorAll('.medicine-row');
    
    rows.forEach((row, index) => {
        const name = row.querySelector('.medicine-name').value.trim();
        const qty = parseFloat(row.querySelector('.medicine-qty').value) || 0;
        const price = parseFloat(row.querySelector('.medicine-price').value) || 0;
        const discount = parseFloat(row.querySelector('.medicine-discount').value) || 0;
        const amount = parseFloat(row.querySelector('.row-amount').textContent) || 0;
        
        if (name || price > 0) {
            medicines.push({
                sr: index + 1,
                name: name || '-',
                qty: qty,
                price: price.toFixed(2),
                discount: discount,
                amount: amount.toFixed(2)
            });
        }
    });
    
    return {
        shop: STORE_INFO,
        patient: {
            name: document.getElementById('patientName').value.trim(),
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address') ? document.getElementById('address').value.trim() : ''
        },
        bill: {
            date: document.getElementById('billDate').value,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            number: document.getElementById('billNo').value || billNumber
        },
        medicines: medicines,
        subtotal: subtotalAmountEl.textContent,
        discount: discountAmountEl.textContent,
        afterDiscount: afterDiscountAmountEl ? afterDiscountAmountEl.textContent : (subtotalAmountEl.textContent - discountAmountEl.textContent).toFixed(2),
        cashDiscount: cashDiscountEl.value || '0.00',
        roundOff: roundOffEl.value || '0.00',
        total: totalAmountEl.textContent,
        totalInWords: numberToWords(parseFloat(totalAmountEl.textContent) || 0)
    };
}

/**
 * Validate form before generating bill
 */
function validateForm() {
    const data = getFormData();
    
    if (!data.patient.name) {
        showToast('Please enter patient name', 'error');
        document.getElementById('patientName').focus();
        return false;
    }
    
    if (data.medicines.length === 0) {
        showToast('Please add at least one medicine', 'error');
        return false;
    }
    
    return true;
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) {
        const now = new Date();
        return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Utility to convert number to words (Indian Style)
 */
function numberToWords(amount) {
    const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    function convert(n) {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
        if (n < 1000) return units[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    }

    const whole = Math.floor(amount);
    const fraction = Math.round((amount - whole) * 100);
    
    let res = "RS. " + (whole === 0 ? "ZERO" : convert(whole));
    if (fraction > 0) {
        res += " AND " + convert(fraction) + " PAISE";
    }
    return res + " ONLY";
}

/**
 * Generate professional bill on full A4 page using jsPDF directly
 */
function generateSingleBill(pdf, data, x, y, width, height) {
    const margin = 15;
    const paddingX = 20;
    const startX = x + paddingX;
    const endX = x + width - paddingX;
    const innerWidth = width - (paddingX * 2);
    let currentY = y + 20;
    
    // Set Font to Courier for typewriter look
    pdf.setFont('courier', 'bold');
    pdf.setDrawColor(0, 0, 0);
    
    // Green "+" Medical Logo (Even Bigger)
    const logoX = startX + 6;
    const logoY = y + 18;
    pdf.setFillColor(40, 167, 69); // Green
    pdf.circle(logoX, logoY, 12, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.5);
    pdf.line(logoX - 6, logoY, logoX + 6, logoY);
    pdf.line(logoX, logoY - 6, logoX, logoY + 6);
    pdf.setLineWidth(0.2); // Reset
    pdf.setDrawColor(0, 0, 0);

    // 1. Header (Centered)
    pdf.setFontSize(14);
    pdf.text(data.shop.name, x + width / 2, currentY, { align: 'center' });
    currentY += 8;
    
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(9);
    // Address lines
    const addressLines = [
        'PLOT NO. 10, NEAR MAHALUNGE CIRCLE, MAHALUNGE',
        'PUNE 411045',
        '(Chemists & Druggists)',
        'D.L. NO. 21525038000360'
    ];
    addressLines.forEach(line => {
        pdf.text(line, x + width / 2, currentY, { align: 'center' });
        currentY += 5;
    });
    currentY += 5;

    // Line 1
    pdf.setLineWidth(0.5);
    pdf.line(startX, currentY, endX, currentY);
    currentY += 10;
    
    // 2. Patient & Bill Info
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(10);
    pdf.text('TO:', startX, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(data.patient.name.toUpperCase(), startX, currentY + 6);
    
    // Right side info
    pdf.setFont('courier', 'bold');
    pdf.text('BILL NO.:', endX - 45, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(String(data.bill.number), endX, currentY, { align: 'right' });
    
    currentY += 6;
    pdf.setFont('courier', 'bold');
    pdf.text('BILL DATE:', endX - 45, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(formatDate(data.bill.date), endX, currentY, { align: 'right' });
    
    currentY += 6;
    pdf.setFont('courier', 'bold');
    pdf.text('BILL TIME:', endX - 45, currentY);
    pdf.setFont('courier', 'normal');
    pdf.text(data.bill.time || '', endX, currentY, { align: 'right' });
    
    currentY += 12;
    pdf.setFont('courier', 'bold');
    pdf.text('PRESCRIBED BY. RUGVED DONGRE', startX, currentY);
    currentY += 10;
    
    // Line 2
    pdf.setLineWidth(0.5);
    pdf.line(startX, currentY, endX, currentY);
    currentY += 1; // Start table just below line
    
    // 3. Medicine Table
    // Columns: S.N, QTY, PRODUCT, MRP, DISC %, AMOUNT
    const colWidths = [12, 12, 85, 25, 20, 20]; 
    // Total is innerWidth. Let's adjust slightly for fit.
    const colsX = [startX];
    for (let i = 1; i < colWidths.length; i++) {
        colsX.push(colsX[i-1] + (innerWidth * (colWidths[i-1] / 174))); // Rough ratio
    }

    const rowHeight = 8;
    
    // Table Header
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    
    // Fill header with bright yellow
    pdf.setFillColor(255, 255, 0);
    pdf.rect(startX, currentY, innerWidth, rowHeight, 'F');
    
    // Draw horizontal lines for table header top and bottom
    pdf.line(startX, currentY, endX, currentY);
    pdf.line(startX, currentY + rowHeight, endX, currentY + rowHeight);
    
    // Vertical lines for header
    let curX = startX;
    const drawTableGrid = (yTop, yBottom) => {
        pdf.line(startX, yTop, startX, yBottom);
        pdf.line(endX, yTop, endX, yBottom);
        let xPos = startX;
        // colWidths ratio based on 100% innerWidth
        const ratios = [0.08, 0.08, 0.45, 0.14, 0.12, 0.13]; 
        let xPositions = [startX];
        let accX = startX;
        for(let i=0; i<ratios.length-1; i++){
            accX += innerWidth * ratios[i];
            xPositions.push(accX);
            pdf.line(accX, yTop, accX, yBottom);
        }
        return xPositions;
    };
    
    const xPositions = drawTableGrid(currentY, currentY + rowHeight);
    
    const headers = ['S.N', 'QTY', 'PRODUCT', 'MRP', 'DISC %', 'AMOUNT'];
    headers.forEach((h, i) => {
        pdf.text(h, xPositions[i] + (i === 0 || i === 1 ? 1 : 2), currentY + 5);
    });
    
    currentY += rowHeight;
    
    // Table Rows
    pdf.setFont('courier', 'normal');
    const maxRows = Math.max(8, data.medicines.length);
    const tableBottomY = currentY + (maxRows * rowHeight);
    
    // Draw vertical lines for the whole table height
    drawTableGrid(currentY - rowHeight, tableBottomY);
    
    for (let i = 0; i < maxRows; i++) {
        const med = data.medicines[i];
        if (med) {
            pdf.text(String(med.sr), xPositions[0] + 1, currentY + 5);
            pdf.text(String(med.qty), xPositions[1] + 2, currentY + 5);
            pdf.text(med.name.substring(0, 35).toUpperCase(), xPositions[2] + 2, currentY + 5);
            pdf.text(med.price, xPositions[3] + 2, currentY + 5);
            pdf.text(med.discount > 0 ? med.discount + '%' : '0.0%', xPositions[4] + 2, currentY + 5);
            pdf.text(med.amount, endX - 2, currentY + 5, { align: 'right' });
        }
        // Draw horizontal line for each row
        pdf.line(startX, currentY + rowHeight, endX, currentY + rowHeight);
        currentY += rowHeight;
    }
    
    currentY += 10;
    
    // 4. Totals Section
    pdf.setFont('courier', 'bold');
    const totalLabelX = startX + 5;
    const totalValueX = endX;
    
    const totals = [
        { label: 'SUBTOTAL:', value: data.subtotal },
        { label: 'DISCOUNT:', value: data.discount },
        { label: 'AFTER DISCOUNT:', value: data.afterDiscount },
        { label: 'CASH DISC:', value: data.cashDiscount },
        { label: 'ROUND OFF:', value: data.roundOff }
    ];
    
    pdf.setFontSize(9);
    totals.forEach(t => {
        pdf.text(t.label, totalLabelX, currentY);
        pdf.text(t.value, totalValueX, currentY, { align: 'right' });
        currentY += 6;
    });
    
    currentY += 2;
    pdf.line(startX, currentY, endX, currentY);
    currentY += 8;
    
    pdf.setFontSize(10);
    pdf.text('PLEASE PAY:', totalLabelX, currentY);
    // Slightly larger for the actual amount
    pdf.setFontSize(12);
    // Explicitly set charSpace to 0 to avoid spaced out digits
    pdf.text('RS. ' + String(data.total).replace(/\s+/g, ''), totalValueX, currentY, { align: 'right', charSpace: 0 });
    
    currentY += 12;
    // Total in words
    pdf.setFontSize(9);
    pdf.text(data.totalInWords.toUpperCase(), x + width / 2, currentY, { align: 'center' });
    
    currentY += 10;
    pdf.setLineWidth(0.2);
    pdf.line(startX, currentY, endX, currentY);
    currentY += 10;
    
    // Footer notes
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    pdf.text('All Medicines subject to Pune Jurisdiction only', x + width / 2, currentY, { align: 'center' });
    currentY += 5;
    pdf.text('Price Inclusive of all taxes', x + width / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.setFontSize(8);
    pdf.text('PRESCRIBED BY. RUGVED DONGRE', endX, currentY, { align: 'right' });
}

/**
 * Generate PDF with single bill on A4 page
 */
async function generatePDF() {
    if (!validateForm()) return;
    
    generatePdfBtn.classList.add('loading');
    showToast('Generating PDF...', 'info');
    
    try {
        const data = getFormData();
        
        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // A4 dimensions: 210 x 297 mm
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Generate single bill on full page
        generateSingleBill(pdf, data, 0, 0, pageWidth, pageHeight);
        
        // Save as blob for WhatsApp sharing
        generatedPdfBlob = pdf.output('blob');
        
        // Save the PDF
        const fileName = `Bill_${data.bill.number}_${data.patient.name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        // Update bill number for next bill
        localStorage.setItem('lastBillNo', data.bill.number);
        billNumber = parseInt(data.bill.number) + 1;
        
        showToast('PDF generated successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    } finally {
        generatePdfBtn.classList.remove('loading');
    }
}

/**
 * Print the bill
 */
function printBill() {
    if (!validateForm()) return;
    
    printBtn.classList.add('loading');
    
    try {
        const data = getFormData();
        
        // Generate bill HTML for printing
        const billHTML = generatePrintBillHTML(data);
        
        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            showToast('Please allow popups to print', 'error');
            printBtn.classList.remove('loading');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill - ${data.patient.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color: #1e3a5f;
                    }
                    .print-page {
                        width: 180mm;
                        min-height: 267mm;
                        padding: 0;
                        border: 2px solid #1e3a5f;
                    }
                    .bill-header {
                        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
                        color: white;
                        padding: 15px;
                        text-align: center;
                    }
                    .bill-header h1 {
                        font-size: 16pt;
                        color: #e8a838;
                        margin-bottom: 5px;
                    }
                    .bill-header p {
                        font-size: 9pt;
                        margin: 2px 0;
                    }
                    .bill-header .phone {
                        font-size: 10pt;
                        font-weight: bold;
                        color: #e8a838;
                    }
                    .cash-memo {
                        background: #e8a838;
                        color: #1e3a5f;
                        text-align: center;
                        font-weight: bold;
                        font-size: 12pt;
                        padding: 6px;
                    }
                    .bill-info {
                        display: flex;
                        border: 1px solid #1e3a5f;
                        margin: 10px;
                    }
                    .bill-info-left {
                        flex: 0.6;
                        padding: 8px;
                        background: #f0f4f8;
                        font-size: 10pt;
                        line-height: 1.6;
                    }
                    .bill-info-right {
                        flex: 0.4;
                        padding: 8px;
                        font-size: 10pt;
                        line-height: 1.6;
                    }
                    .bill-table {
                        width: calc(100% - 20px);
                        margin: 0 10px;
                        border-collapse: collapse;
                        font-size: 9pt;
                    }
                    .bill-table th {
                        background: #1e3a5f;
                        color: white;
                        padding: 8px 5px;
                        text-align: left;
                        font-size: 8pt;
                    }
                    .bill-table td {
                        border: 1px solid #d1dbe6;
                        padding: 6px 5px;
                    }
                    .bill-table tbody tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    .col-sr { width: 6%; text-align: center !important; }
                    .col-name { width: 40%; }
                    .col-qty { width: 10%; text-align: center !important; }
                    .col-price { width: 14%; text-align: right !important; }
                    .col-discount { width: 12%; text-align: center !important; }
                    .col-amount { width: 18%; text-align: right !important; }
                    .totals {
                        margin: 10px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 10px;
                        font-size: 10pt;
                    }
                    .total-row.subtotal {
                        background: #f0f4f8;
                        color: #5a7a9a;
                    }
                    .total-row.discount {
                        background: #e8f5e9;
                        color: #28a745;
                    }
                    .total-row.grand {
                        background: #e8a838;
                        color: #1e3a5f;
                        font-weight: bold;
                        font-size: 12pt;
                        padding: 8px 10px;
                    }
                    .total-label {
                        /* removed margin-right for space-between */
                    }
                    .bill-footer {
                        display: flex;
                        justify-content: space-between;
                        margin: 15px 10px;
                        font-size: 9pt;
                    }
                    .signature-area {
                        text-align: right;
                    }
                    .signature-line {
                        border-top: 1px solid #1e3a5f;
                        width: 50mm;
                        margin-left: auto;
                        margin-top: 15mm;
                    }
                    .signature-text {
                        font-size: 9pt;
                        margin-top: 2mm;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="print-page">
                    ${billHTML}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        }, 250);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Update bill number
        localStorage.setItem('lastBillNo', data.bill.number);
        billNumber = parseInt(data.bill.number) + 1;
        
        showToast('Print dialog opening...', 'success');
    } catch (error) {
        console.error('Print error:', error);
        showToast('Error printing. Please try again.', 'error');
    } finally {
        setTimeout(() => {
            printBtn.classList.remove('loading');
        }, 1000);
    }
}

/**
 * Generate bill HTML for printing - Full A4 size single bill
 */
function generatePrintBillHTML(data) {
    const maxRows = Math.max(8, data.medicines.length);
    let medicineRows = '';
    
    for (let i = 0; i < maxRows; i++) {
        const med = data.medicines[i];
        if (med) {
            medicineRows += `
                <tr>
                    <td class="col-sr">${med.sr}</td>
                    <td class="col-qty">${med.qty}</td>
                    <td class="col-name">${med.name.toUpperCase()}</td>
                    <td class="col-price">${med.price}</td>
                    <td class="col-discount">${med.discount > 0 ? med.discount + '%' : '0.0%'}</td>
                    <td class="col-amount">${med.amount}</td>
                </tr>
            `;
        } else {
            medicineRows += `
                <tr>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
            `;
        }
    }
    
    return `
        <style>
            .print-bill {
                font-family: 'Courier New', Courier, monospace;
                color: #000;
                padding: 10px;
                text-transform: uppercase;
                position: relative;
            }
            .logo-container {
                position: absolute;
                top: 5px;
                left: 10px;
            }
            .print-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .print-header h1 { font-size: 18pt; margin-bottom: 5px; }
            .print-header p { font-size: 10pt; margin: 2px 0; }
            .hr-line { border-top: 2px solid #000; margin: 10px 0; }
            .bill-top-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                font-size: 11pt;
            }
            .bill-table-print {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 10pt;
            }
            .bill-table-print th {
                background: #ffff00; /* Bright Yellow */
                color: #000;
                padding: 5px;
                text-align: left;
                border: 1px solid #000;
            }
            .bill-table-print td {
                border: 1px solid #000;
                padding: 5px;
                text-align: left;
            }
            .text-right { text-align: right !important; }
            .print-totals {
                width: 100%;
                margin-bottom: 20px;
                font-size: 11pt;
            }
            .total-row-p {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
            }
            .grand-total-p {
                font-size: 13pt;
                font-weight: bold;
                border-top: 1px solid #000;
                margin-top: 5px;
                padding-top: 5px;
            }
            .in-words {
                text-align: center;
                margin: 15px 0;
                font-weight: bold;
                font-size: 10pt;
            }
            .print-footer {
                text-align: center;
                font-size: 9pt;
                margin-top: 30px;
            }
            .signature-p {
                text-align: right;
                margin-top: 40px;
                font-size: 10pt;
            }
        </style>
        <div class="print-bill">
            <div class="logo-container">
                <svg width="120" height="120" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="#28a745"/> <!-- Green Circle -->
                    <rect x="45" y="25" width="10" height="50" fill="white"/> <!-- Vertical line -->
                    <rect x="25" y="45" width="50" height="10" fill="white"/> <!-- Horizontal line -->
                </svg>
            </div>
            <div class="print-header">
                <h1>${data.shop.name}</h1>
                <p>PLOT NO. 10, NEAR MAHALUNGE CIRCLE, MAHALUNGE</p>
                <p>PUNE 411045</p>
                <p>(Chemists & Druggists)</p>
                <p>D.L. NO. 21525038000360</p>
            </div>
            
            <div class="hr-line"></div>
            
            <div class="bill-top-info">
                <div>
                    <strong>TO:</strong><br>
                    ${data.patient.name}<br>
                    <strong>PRESCRIBED BY. RUGVED DONGRE</strong>
                </div>
                <div class="text-right">
                    <strong>BILL NO:</strong> ${data.bill.number}<br>
                    <strong>BILL DATE:</strong> ${formatDate(data.bill.date)}<br>
                    <strong>BILL TIME:</strong> ${data.bill.time}
                </div>
            </div>
            
            <table class="bill-table-print">
                <thead>
                    <tr>
                        <th>S.N</th>
                        <th>QTY</th>
                        <th>PRODUCT</th>
                        <th>MRP</th>
                        <th>DISC%</th>
                        <th>AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicineRows}
                </tbody>
            </table>
            
            <div class="print-totals">
                <div class="total-row-p"><span>SUBTOTAL:</span> <span>${data.subtotal}</span></div>
                <div class="total-row-p"><span>DISCOUNT:</span> <span>${data.discount}</span></div>
                <div class="total-row-p"><span>AFTER DISCOUNT:</span> <span>${data.afterDiscount}</span></div>
                <div class="total-row-p"><span>CASH DISC:</span> <span>${data.cashDiscount}</span></div>
                <div class="total-row-p"><span>ROUND OFF:</span> <span>${data.roundOff}</span></div>
                <div class="total-row-p grand-total-p"><span>PLEASE PAY:</span> <span>RS. ${data.total}</span></div>
            </div>
            
            <div class="in-words">${data.totalInWords}</div>
            
            <div class="hr-line"></div>
            
            <div class="print-footer">
                <p>All Medicines subject to Pune Jurisdiction only</p>
                <p>Price Inclusive of all taxes</p>
            </div>
            
            <div class="signature-p">
                PRESCRIBED BY. RUGVED DONGRE
            </div>
        </div>
    `;
}

/**
 * Share bill PDF via WhatsApp
 */
async function shareToWhatsApp() {
    if (!validateForm()) return;
    
    whatsappBtn.classList.add('loading');
    showToast('Generating PDF...', 'info');
    
    try {
        const data = getFormData();
        
        // Generate PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Generate single bill on full page
        generateSingleBill(pdf, data, 0, 0, pageWidth, pageHeight);
        
        const pdfBlob = pdf.output('blob');
        const fileName = `Bill_${data.bill.number}_${data.patient.name.replace(/\s+/g, '_')}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        // Try Web Share API (best method - shares PDF directly)
        if (navigator.share) {
            try {
                const shareData = { files: [file] };
                
                // Check if file sharing is supported
                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    
                    // Update bill number on success
                    localStorage.setItem('lastBillNo', data.bill.number);
                    billNumber = parseInt(data.bill.number) + 1;
                    
                    showToast('PDF shared!', 'success');
                    whatsappBtn.classList.remove('loading');
                    return;
                } else {
                    // Try without canShare check (some browsers support share but not canShare)
                    await navigator.share(shareData);
                    
                    localStorage.setItem('lastBillNo', data.bill.number);
                    billNumber = parseInt(data.bill.number) + 1;
                    
                    showToast('PDF shared!', 'success');
                    whatsappBtn.classList.remove('loading');
                    return;
                }
            } catch (shareError) {
                if (shareError.name === 'AbortError') {
                    showToast('Share cancelled', 'info');
                    whatsappBtn.classList.remove('loading');
                    return;
                }
                console.log('Web Share failed:', shareError.message);
                // Continue to fallback
            }
        }
        
        // Fallback: Download PDF and show instructions
        showToast('Downloading PDF...', 'info');
        
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Wait for download to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        URL.revokeObjectURL(url);
        
        // Get phone number
        let phone = '';
        if (data.patient.phone) {
            phone = data.patient.phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
            if (phone.length === 10) {
                phone = '91' + phone;
            }
        }
        
        // Update bill number
        localStorage.setItem('lastBillNo', data.bill.number);
        billNumber = parseInt(data.bill.number) + 1;
        
        // Open WhatsApp (user needs to attach the downloaded PDF manually)
        const whatsappUrl = phone 
            ? `https://api.whatsapp.com/send?phone=${phone}`
            : `https://api.whatsapp.com/send`;
        
        showToast('PDF downloaded! Attach it in WhatsApp', 'success');
        
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
        }, 500);
        
    } catch (error) {
        console.error('WhatsApp share error:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        whatsappBtn.classList.remove('loading');
    }
}

/**
 * Clear form and start new bill
 */
function clearForm() {
    if (confirm('Are you sure you want to clear the form?')) {
        // Clear patient details
        document.getElementById('patientName').value = '';
        document.getElementById('age').value = '';
        document.getElementById('gender').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('address').value = '';
        
        // Clear medicine rows (keep only one empty row)
        medicineBody.innerHTML = `
            <tr class="medicine-row">
                <td class="col-sr">1</td>
                <td class="col-qty">
                    <input type="number" class="medicine-qty" placeholder="1" min="1" value="1">
                </td>
                <td class="col-name">
                    <input type="text" class="medicine-name" placeholder="Medicine name">
                </td>
                <td class="col-price">
                    <input type="number" class="medicine-price" placeholder="0" min="0" step="0.01">
                </td>
                <td class="col-discount">
                    <input type="number" class="medicine-discount" placeholder="0" min="0" max="100" value="0">
                </td>
                <td class="col-amount">
                    <span class="row-amount">0.00</span>
                </td>
                <td class="col-action">
                    <button type="button" class="btn-remove-row" title="Remove">×</button>
                </td>
            </tr>
        `;
        
        // Reattach event listeners to new row
        const newRow = medicineBody.querySelector('.medicine-row');
        attachRowEventListeners(newRow);
        
        // Reset totals
        subtotalAmountEl.textContent = '0.00';
        discountAmountEl.textContent = '0.00';
        totalAmountEl.textContent = '0.00';
        
        // Update bill number
        document.getElementById('billNo').value = billNumber;
        
        // Reset date to today
        document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
        
        // Focus on patient name
        document.getElementById('patientName').focus();
        
        showToast('Form cleared', 'success');
    }
}

/**
 * New bill - increment bill number
 */
function newBill() {
    clearForm();
    document.getElementById('billNo').value = billNumber;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';
    if (type) {
        toast.classList.add(type);
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Register Service Worker for PWA
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('ServiceWorker registered:', registration.scope);
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        });
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt(deferredPrompt);
    });
}

/**
 * Show install prompt for PWA
 */
function showInstallPrompt(deferredPrompt) {
    // Check if already shown or dismissed
    if (localStorage.getItem('installPromptDismissed')) {
        return;
    }
    
    const promptDiv = document.createElement('div');
    promptDiv.className = 'install-prompt';
    promptDiv.innerHTML = `
        <div class="install-prompt-icon">📱</div>
        <div class="install-prompt-content">
            <div class="install-prompt-title">Install App</div>
            <div class="install-prompt-text">Add to home screen for quick access</div>
        </div>
        <button class="install-prompt-btn">Install</button>
        <button class="install-prompt-close">×</button>
    `;
    
    document.body.appendChild(promptDiv);
    
    // Show with animation
    setTimeout(() => promptDiv.classList.add('show'), 100);
    
    // Install button click
    promptDiv.querySelector('.install-prompt-btn').addEventListener('click', async () => {
        promptDiv.classList.remove('show');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);
        setTimeout(() => promptDiv.remove(), 300);
    });
    
    // Close button click
    promptDiv.querySelector('.install-prompt-close').addEventListener('click', () => {
        promptDiv.classList.remove('show');
        localStorage.setItem('installPromptDismissed', 'true');
        setTimeout(() => promptDiv.remove(), 300);
    });
}
