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
        <td class="col-name">
            <input type="text" class="medicine-name" placeholder="Medicine name">
        </td>
        <td class="col-qty">
            <input type="number" class="medicine-qty" placeholder="1" min="1" value="1">
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
    
    const grandTotal = subtotal - totalDiscount;
    
    subtotalAmountEl.textContent = subtotal.toFixed(2);
    discountAmountEl.textContent = totalDiscount.toFixed(2);
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
            address: document.getElementById('address').value.trim()
        },
        bill: {
            date: document.getElementById('billDate').value,
            number: document.getElementById('billNo').value || billNumber
        },
        medicines: medicines,
        subtotal: subtotalAmountEl.textContent,
        discount: discountAmountEl.textContent,
        total: totalAmountEl.textContent
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
 * Generate professional bill on full A4 page using jsPDF directly
 */
function generateSingleBill(pdf, data, x, y, width, height) {
    const margin = 15;
    const innerWidth = width - (margin * 2);
    const startX = x + margin;
    let currentY = y + margin;
    
    // Colors
    const primaryColor = [30, 58, 95]; // #1e3a5f
    const accentColor = [232, 168, 56]; // #e8a838
    const textGray = [90, 122, 154]; // #5a7a9a
    
    // Border around entire bill
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.rect(x + 10, y + 10, width - 20, height - 20);
    
    // Header Background
    pdf.setFillColor(...primaryColor);
    pdf.rect(x + 10, y + 10, width - 20, 35, 'F');
    
    // Shop Name
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(232, 168, 56); // Accent color
    pdf.text(data.shop.name, x + width / 2, currentY + 8, { align: 'center' });
    currentY += 12;
    
    // Shop Address
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text(data.shop.address, x + width / 2, currentY + 3, { align: 'center' });
    currentY += 5;

    // License
    pdf.setFontSize(8);
    pdf.text(data.shop.license, x + width / 2, currentY + 3, { align: 'center' });
    currentY += 5;
    
    // Shop Phone
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ph: ' + data.shop.phone, x + width / 2, currentY + 3, { align: 'center' });
    currentY += 16;
    
    // CASH MEMO title with accent bar
    pdf.setFillColor(...accentColor);
    pdf.rect(startX, currentY, innerWidth, 8, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('CASH MEMO', x + width / 2, currentY + 6, { align: 'center' });
    currentY += 14;
    
    // Patient Info Box
    const infoBoxHeight = 28;
    
    // Left column background - Draw first so border is on top
    pdf.setFillColor(240, 244, 248);
    pdf.rect(startX, currentY, innerWidth * 0.6, infoBoxHeight, 'F');
    
    // Patient Info Box Border
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.rect(startX, currentY, innerWidth, infoBoxHeight);
    
    // Vertical divider line between columns
    pdf.line(startX + innerWidth * 0.6, currentY, startX + innerWidth * 0.6, currentY + infoBoxHeight);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...primaryColor);
    
    // Left side - Patient info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient: ', startX + 4, currentY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.patient.name || '', startX + 22, currentY + 7);
    
    let patientDetails = '';
    if (data.patient.age) patientDetails += 'Age: ' + data.patient.age;
    if (data.patient.gender) patientDetails += (patientDetails ? '   |   ' : '') + data.patient.gender;
    if (patientDetails) {
        pdf.text(patientDetails, startX + 4, currentY + 14);
    }
    if (data.patient.address) {
        pdf.setFontSize(9);
        const address = 'Addr: ' + data.patient.address;
        const splitAddress = pdf.splitTextToSize(address, (innerWidth * 0.6) - 8);
        pdf.text(splitAddress, startX + 4, currentY + 21);
    }
    if (data.patient.phone) {
        // Move phone down slightly if address is long (wrapped)
        const addressLines = data.patient.address ? pdf.splitTextToSize('Addr: ' + data.patient.address, (innerWidth * 0.6) - 8).length : 1;
        const phoneY = currentY + 21 + (addressLines * 4);
        pdf.text('Ph: ' + data.patient.phone, startX + 4, Math.min(phoneY, currentY + 27));
    }
    
    // Right side - Bill info
    const rightX = startX + innerWidth * 0.62;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill No: ', rightX, currentY + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(data.bill.number), rightX + 18, currentY + 10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date: ', rightX, currentY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDate(data.bill.date), rightX + 14, currentY + 20);
    
    currentY += infoBoxHeight + 6;
    
    // Medicine Table
    const colWidths = [15, innerWidth - 100, 18, 25, 18, 24]; // Sr, Name, Qty, MRP, Disc%, Amount
    const rowHeight = 9;
    const maxRows = Math.max(10, data.medicines.length);
    
    // Table header
    pdf.setFillColor(...primaryColor);
    pdf.rect(startX, currentY, innerWidth, rowHeight + 2, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    
    let colX = startX;
    pdf.text('Sr', colX + 5, currentY + 6);
    colX += colWidths[0];
    pdf.text('Medicine Name', colX + 3, currentY + 6);
    colX += colWidths[1];
    pdf.text('Qty', colX + 3, currentY + 6);
    colX += colWidths[2];
    pdf.text('MRP', colX + 3, currentY + 6);
    colX += colWidths[3];
    pdf.text('Disc%', colX + 1, currentY + 6);
    colX += colWidths[4];
    pdf.text('Amount', colX + 2, currentY + 6);
    
    currentY += rowHeight + 2;
    
    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...primaryColor);
    
    for (let i = 0; i < maxRows; i++) {
        const med = data.medicines[i];
        
        // Alternate row colors
        if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(startX, currentY, innerWidth, rowHeight, 'F');
        }
        
        // Row border
        pdf.setDrawColor(209, 219, 230);
        pdf.setLineWidth(0.3);
        pdf.rect(startX, currentY, innerWidth, rowHeight);
        
        // Column separators
        colX = startX + colWidths[0];
        for (let j = 0; j < 5; j++) {
            pdf.line(colX, currentY, colX, currentY + rowHeight);
            colX += colWidths[j + 1];
        }
        
        colX = startX;
        if (med) {
            pdf.text(String(med.sr), colX + 5, currentY + 6);
            colX += colWidths[0];
            pdf.text(med.name.substring(0, 30), colX + 3, currentY + 6);
            colX += colWidths[1];
            pdf.text(String(med.qty), colX + 5, currentY + 6);
            colX += colWidths[2];
            pdf.text(med.price, colX + 3, currentY + 6);
            colX += colWidths[3];
            pdf.text(med.discount > 0 ? med.discount + '%' : '-', colX + 3, currentY + 6);
            colX += colWidths[4];
            pdf.text(med.amount, colX + 3, currentY + 6);
        }
        
        currentY += rowHeight;
    }
    
    // Totals section
    currentY += 4;
    
    // Subtotal row
    pdf.setFillColor(240, 244, 248);
    pdf.rect(startX, currentY, innerWidth, 8, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(...textGray);
    pdf.text('Subtotal:', startX + innerWidth - 50, currentY + 6);
    pdf.text('Rs. ' + data.subtotal, startX + innerWidth - 5, currentY + 6, { align: 'right' });
    currentY += 8;
    
    // Discount row
    pdf.setFillColor(232, 245, 233);
    pdf.rect(startX, currentY, innerWidth, 8, 'F');
    pdf.setTextColor(40, 167, 69);
    pdf.text('Discount:', startX + innerWidth - 50, currentY + 6);
    pdf.text('- Rs. ' + data.discount, startX + innerWidth - 5, currentY + 6, { align: 'right' });
    currentY += 8;
    
    // Grand Total row
    pdf.setFillColor(...accentColor);
    pdf.rect(startX, currentY, innerWidth, 12, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('GRAND TOTAL:', startX + innerWidth - 100, currentY + 9);
    pdf.text('Rs. ' + data.total, startX + innerWidth - 5, currentY + 9, { align: 'right' });
    
    currentY += 18;
    
    // Footer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...textGray);
    pdf.text('Thank you for choosing ' + data.shop.name.split(' ')[0] + ' ' + data.shop.name.split(' ')[1] + '!', startX + 5, currentY);
    
    // Signature area
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...primaryColor);
    const sigX = startX + innerWidth - 45;
    pdf.line(sigX, currentY + 12, startX + innerWidth - 5, currentY + 12);
    pdf.text('Authorized Signature', sigX - 2, currentY + 18);
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
    const maxRows = Math.max(10, data.medicines.length);
    let medicineRows = '';
    
    for (let i = 0; i < maxRows; i++) {
        const med = data.medicines[i];
        if (med) {
            medicineRows += `
                <tr>
                    <td class="col-sr">${med.sr}</td>
                    <td class="col-name">${med.name}</td>
                    <td class="col-qty">${med.qty}</td>
                    <td class="col-price">${med.price}</td>
                    <td class="col-discount">${med.discount > 0 ? med.discount + '%' : '-'}</td>
                    <td class="col-amount">${med.amount}</td>
                </tr>
            `;
        } else {
            medicineRows += `
                <tr>
                    <td class="col-sr">&nbsp;</td>
                    <td class="col-name">&nbsp;</td>
                    <td class="col-qty">&nbsp;</td>
                    <td class="col-price">&nbsp;</td>
                    <td class="col-discount">&nbsp;</td>
                    <td class="col-amount">&nbsp;</td>
                </tr>
            `;
        }
    }
    
    return `
        <div class="bill-header">
            <h1>${data.shop.name}</h1>
            <p>${data.shop.address}</p>
            <p>${data.shop.license}</p>
            <p class="phone">📞 ${data.shop.phone}</p>
        </div>
        
        <div class="cash-memo">CASH MEMO</div>
        
        <div class="bill-info">
            <div class="bill-info-left">
                <div><strong>Patient:</strong> ${data.patient.name}</div>
                ${data.patient.age || data.patient.gender ? 
                    `<div>${data.patient.age ? 'Age: ' + data.patient.age : ''} ${data.patient.gender ? '| ' + data.patient.gender : ''}</div>` : ''}
                ${data.patient.address ? `<div>Address: ${data.patient.address}</div>` : ''}
                ${data.patient.phone ? `<div>Ph: ${data.patient.phone}</div>` : ''}
            </div>
            <div class="bill-info-right">
                <div><strong>Bill No:</strong> ${data.bill.number}</div>
                <div><strong>Date:</strong> ${formatDate(data.bill.date)}</div>
            </div>
        </div>
        
        <table class="bill-table">
            <thead>
                <tr>
                    <th class="col-sr">Sr</th>
                    <th class="col-name">Medicine Name</th>
                    <th class="col-qty">Qty</th>
                    <th class="col-price">MRP</th>
                    <th class="col-discount">Disc%</th>
                    <th class="col-amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${medicineRows}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-row subtotal">
                <span class="total-label">Subtotal:</span>
                <span>Rs. ${data.subtotal}</span>
            </div>
            <div class="total-row discount">
                <span class="total-label">Discount:</span>
                <span>- Rs. ${data.discount}</span>
            </div>
            <div class="total-row grand">
                <span class="total-label">GRAND TOTAL:</span>
                <span>Rs. ${data.total}</span>
            </div>
        </div>
        
        <div class="bill-footer">
            <div>Thank you for choosing Shree Vighnaharta!</div>
            <div class="signature-area">
                <div class="signature-line"></div>
                <div class="signature-text">Authorized Signature</div>
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
                <td class="col-name">
                    <input type="text" class="medicine-name" placeholder="Medicine name">
                </td>
                <td class="col-qty">
                    <input type="number" class="medicine-qty" placeholder="1" min="1" value="1">
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
