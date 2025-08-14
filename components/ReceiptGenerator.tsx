import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
    orderId: string;
    customerName?: string;
    customerEmail?: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    orderDate: string;
    deliveryAddress?: string;
}

interface ReceiptGeneratorProps {
    receiptData: ReceiptData;
    onDownload?: () => void;
}

export default function ReceiptGenerator({ receiptData, onDownload }: ReceiptGeneratorProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const generatePDF = async () => {
        if (!receiptRef.current) return;

        try {
            // Create canvas from the receipt element
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add new pages if content is longer than one page
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Download the PDF
            pdf.save(`BeerHub-Receipt-${receiptData.orderId}.pdf`);

            if (onDownload) {
                onDownload();
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF receipt. Please try again.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            {/* Download Button */}
            <button
                onClick={generatePDF}
                className="btn btn-outline-primary mb-3"
            >
                📄 Download PDF Receipt
            </button>

            {/* Hidden Receipt Template */}
            <div
                ref={receiptRef}
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    width: '800px',
                    backgroundColor: 'white',
                    padding: '40px',
                    fontFamily: 'Arial, sans-serif'
                }}
            >
                {/* Receipt Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#f39c12', fontSize: '36px', margin: '0' }}>🍺 BeerHub</h1>
                    <p style={{ fontSize: '18px', color: '#666', margin: '5px 0' }}>Premium Japanese Beer Delivery</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>www.beerhub.com | support@beerhub.com</p>
                </div>

                {/* Receipt Title */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', color: '#333', margin: '0' }}>RECEIPT</h2>
                    <p style={{ fontSize: '16px', color: '#666', margin: '5px 0' }}>Order #{receiptData.orderId}</p>
                </div>

                {/* Customer & Order Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div style={{ width: '48%' }}>
                        <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>Customer Information</h3>
                        {receiptData.customerName && (
                            <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                <strong>Name:</strong> {receiptData.customerName}
                            </p>
                        )}
                        {receiptData.customerEmail && (
                            <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                <strong>Email:</strong> {receiptData.customerEmail}
                            </p>
                        )}
                        {receiptData.deliveryAddress && (
                            <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                <strong>Delivery:</strong> {receiptData.deliveryAddress}
                            </p>
                        )}
                    </div>
                    <div style={{ width: '48%' }}>
                        <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>Order Details</h3>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>Date:</strong> {formatDate(receiptData.orderDate)}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>Payment:</strong> {receiptData.paymentMethod}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>Status:</strong> <span style={{ color: '#28a745' }}>Completed</span>
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>
                                Item
                            </th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>
                                Qty
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>
                                Price
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {receiptData.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                                    {item.name}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                                    ¥{item.price.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                                    ¥{item.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ marginLeft: 'auto', width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                        <span>Subtotal:</span>
                        <span>¥{receiptData.subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                        <span>Tax (10%):</span>
                        <span>¥{receiptData.tax.toLocaleString()}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderTop: '2px solid #333',
                        color: '#f39c12'
                    }}>
                        <span>Total:</span>
                        <span>¥{receiptData.total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    <p>Thank you for choosing BeerHub!</p>
                    <p>For support, contact us at support@beerhub.com or call +81-3-1234-5678</p>
                    <p style={{ marginTop: '20px', fontSize: '10px' }}>
                        This is a computer-generated receipt. Please drink responsibly. Must be 20+ years old.
                    </p>
                </div>
            </div>
        </div>
    );
}