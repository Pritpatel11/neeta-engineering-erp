import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import './ChallanPreview.css';

export default function ChallanPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paperSize, setPaperSize] = React.useState('A4');
  const [printLayout, setPrintLayout] = React.useState('portrait');
  const [marginTop, setMarginTop] = React.useState('0');
  const [marginBottom, setMarginBottom] = React.useState('0');
  const [marginLeft, setMarginLeft] = React.useState('0');
  const [marginRight, setMarginRight] = React.useState('0');
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const challanData = location.state?.challanData;

  useEffect(() => {
    // If accessed directly without data, go back to create
    if (!challanData) {
      navigate('/create-challan');
    }
  }, [challanData, navigate]);

  if (!challanData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      const parts = dateString.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  return (
    <div className="preview-container">
      <style>
        {`
          @media print {
            @page {
              size: ${paperSize === 'A4' ? `A4 ${printLayout}` : paperSize} !important;
              margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm !important;
            }
          }
        `}
      </style>
      {/* Actions header (Hidden when printing) */}
      <div className="preview-actions no-print" style={{ flexWrap: 'wrap', gap: '15px' }}>
        <button className="btn-outline-small" onClick={() => navigate('/create-challan', { state: { challanData: challanData }, replace: true })}>
          <ArrowLeft size={16} /> Back to Edit
        </button>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Paper:</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="form-control"
              style={{ width: '130px', padding: '4px' }}
            >
              <option value="A4">A4 Standard</option>
              <option value="150mm 210mm">Custom (150x210)</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#ccc' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Margins (mm):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#666' }}>Top</span>
              <input type="number" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} className="form-control" style={{ width: '45px', padding: '2px 4px' }} min="0" />
              <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>Bottom</span>
              <input type="number" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} className="form-control" style={{ width: '45px', padding: '2px 4px' }} min="0" />
              <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>Left</span>
              <input type="number" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} className="form-control" style={{ width: '45px', padding: '2px 4px' }} min="0" />
              <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>Right</span>
              <input type="number" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} className="form-control" style={{ width: '45px', padding: '2px 4px' }} min="0" />
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#ccc' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Layout:</label>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="form-control"
              style={{ width: '95px', padding: '4px' }}
              disabled={paperSize !== 'A4'}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

        </div>

        <button className="btn-primary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
          <Printer size={18} /> Print Challan
        </button>
      </div>

      {/* The Printable Document */}
      <div className="document-paper">
        <div className="document-header">
          <div className="company-info">
            <img src="./logo address.png" alt="Neeta Engineering Works Logo" style={{ height: '100px', objectFit: 'contain', marginBottom: '0px' }} />
            <h1 className="company-name">Neeta Engineering Works</h1>
            <p className="company-address">179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510</p>
            <p className="company-address">GSTNO: 24ABHPP5386L1Z3</p>
          </div>
          <div className="document-title">
            <h2>DELIVERY CHALLAN</h2>
            <p>(Duplicate for Transporter)</p>
          </div>
        </div>

        <div className="document-details">
          <div className="details-col">
            <div className="detail-row">
              <span className="detail-label">Challan No:</span>
              <span className="detail-value font-mono">{challanData.challanNo}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(challanData.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Contractor:</span>
              <span className="detail-value">{challanData.contractorName}</span>
            </div>
          </div>

          <div className="details-col">
            <div className="detail-row">
              <span className="detail-label">Gate Pass No:</span>
              <span className="detail-value">{challanData.gatePassNo}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Gate Pass Date:</span>
              <span className="detail-value">{formatDate(challanData.gatePassDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Division:</span>
              <span className="detail-value">{challanData.divisionName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sub-Division:</span>
              <span className="detail-value">{challanData.subDivisionName}</span>
            </div>
          </div>
        </div>

        <div className="document-transport">
          <div className="detail-row">
            <span className="detail-label">Vehicle Number:</span>
            <span className="detail-value">{challanData.vehicleNumber}</span>
          </div>
          <div className="detail-row" style={{ marginTop: '4px' }}>
            <span className="detail-label">Driver Name:</span>
            <span className="detail-value">{challanData.driverName || 'N/A'}</span>
          </div>
        </div>

        <div className="document-table-wrapper">
          <table className="document-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px' }}>S.No</th>
                <th>Description of Goods</th>
                <th className="text-center" style={{ width: '80px' }}>Unit</th>
                <th className="text-right" style={{ width: '120px' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {challanData.materials.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.name}</td>
                  <td className="text-center">{item.unit}</td>
                  <td className="text-right font-mono">{item.qty}</td>
                </tr>
              ))}
              {/* Fill empty rows to make it look like a standard table format if items are few */}
              {Array.from({ length: Math.max(0, 3 - challanData.materials.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-bold">Total Items:</td>
                <td className="text-right font-bold font-mono">
                  {challanData.materials.reduce((sum, item) => sum + item.qty, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="document-footer">
          <div className="signature-block">
            <div className="signature-line">
              ...........................................
            </div>
            <div className="signature-label">Driver's Signature</div>
          </div>

          <div className="signature-block" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: '100%', left: '0', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '-45px' }}>
              <img src="./sign.png" alt="Signature" style={{ height: '90px', objectFit: 'contain'}} />
            </div>
            <div className="signature-line">
              ...........................................
            </div>
            <div className="signature-label">Authorized Signatory</div>
            <div className="signature-company">For Neeta Engineering Works</div>
          </div>
        </div>
      </div>
    </div>
  );
}
