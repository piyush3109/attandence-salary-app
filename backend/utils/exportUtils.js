const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const exportToCSV = (data, fields) => {
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(data);
};

const generateSalaryPDF = (report, month, year, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = months[month - 1];

    doc.pipe(res);

    report.forEach((item, index) => {
        if (index > 0) doc.addPage();

        // Header
        doc.rect(0, 0, 612, 100).fill('#0ea5e9');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SALARY SLIP', 50, 40);
        doc.fontSize(12).font('Helvetica').text(`${monthName} ${year}`, 50, 70);

        doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('Employ Management App', 400, 40, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text('Operations Center, HQ Command', 400, 60, { align: 'right' });

        doc.fillColor('#000000').moveDown(4);

        // Employee Info
        doc.fontSize(14).font('Helvetica-Bold').text('EMPLOYEE INFORMATION', 50, 130);
        doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#e5e7eb').stroke();

        doc.fontSize(11).font('Helvetica').text(`Name: ${item.name}`, 50, 165);
        doc.text(`Position: ${item.position}`, 50, 185);
        doc.text(`Employee ID: ${item._id.toString().slice(-6).toUpperCase()}`, 350, 165);
        doc.text(`Rate: ₹${item.rate || 0} (${(item.rateType || 'per_day').replace('_', ' ')})`, 350, 185);

        // Earnings Table
        doc.fontSize(14).font('Helvetica-Bold').text('EARNINGS', 50, 230);
        doc.rect(50, 250, 495, 25).fill('#f8fafc');
        doc.fillColor('#475569').fontSize(10).text('Description', 60, 258);
        doc.text('Quantity', 250, 258);
        doc.text('Rate', 350, 258);
        doc.text('Total', 480, 258);

        doc.fillColor('#000000').fontSize(11).font('Helvetica');
        let currentY = 285;

        // Base Pay Row
        doc.text('Basic Salary', 60, currentY);
        doc.text((item.rateType || 'per_day') === 'per_day' ? `${(item.presentDays || 0) + (item.paidLeaveDays || 0)} Days` : `${(item.totalHours || 0) - (item.overtimeHours || 0)} Hrs`, 250, currentY);
        doc.text(`₹${item.rate || 0}`, 350, currentY);
        doc.text(`₹${(item.baseSalary || 0).toLocaleString()}`, 480, currentY);
        currentY += 25;

        // Overtime Row
        if (item.overtimeHours > 0) {
            doc.text('Overtime (1.5x)', 60, currentY);
            doc.text(`${item.overtimeHours} Hrs`, 250, currentY);
            doc.text(`₹${((item.rate || 0) / ((item.rateType || 'per_day') === 'per_day' ? 8 : 1) * 1.5).toFixed(2)}`, 350, currentY);
            doc.text(`₹${(item.overtimePay || 0).toLocaleString()}`, 480, currentY);
            currentY += 25;
        }

        // Deductions Section
        doc.fontSize(14).font('Helvetica-Bold').text('DEDUCTIONS', 50, currentY + 30);
        doc.moveTo(50, currentY + 50).lineTo(545, currentY + 50).strokeColor('#e5e7eb').stroke();

        doc.fontSize(11).font('Helvetica').text('Advance Payment Deducted', 60, currentY + 65);
        doc.fillColor('#e11d48').text(`- ₹${item.totalAdvance.toLocaleString()}`, 480, currentY + 65);

        // Summary Box
        doc.rect(50, 450, 495, 80).fill('#f1f5f9');
        doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('NET PAYABLE', 70, 485);
        doc.fillColor('#0369a1').fontSize(24).text(`₹${item.finalPayable.toLocaleString()}`, 350, 480, { align: 'right', width: 170 });

        // Footer
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('This is a computer generated document and does not require a signature.', 0, 750, { align: 'center', width: 612 });
    });

    doc.end();
};

const exportAttendanceToCSV = (data) => {
    const fields = [
        { label: 'Date', value: 'date' },
        { label: 'Employee', value: (row) => row.employee?.name || 'N/A' },
        { label: 'Status', value: 'status' },
        { label: 'Working Hours', value: 'workingHours' }
    ];
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(data);
};

module.exports = { exportToCSV, generateSalaryPDF, exportAttendanceToCSV };
