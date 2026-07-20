import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import './ChallanPreview.css'; 

export default function StatementPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [printLayout, setPrintLayout] = React.useState('landscape');
  
  const statementData = location.state?.statementData;

  useEffect(() => {
    if (!statementData) {
      navigate('/create-statement');
    }
  }, [statementData, navigate]);

  if (!statementData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="preview-container">
      <style>
        {`
          @media print {
            @page {
              size: A4 ${printLayout} !important;
              margin: 5mm !important;
            }
            .document-paper {
              padding: 0 !important;
              transform: scale(0.96);
              transform-origin: top left;
              width: 104% !important;
            }
            .statement-preview-table th,
            .statement-preview-table td {
              padding: 2px 4px !important;
              line-height: 1.1 !important;
              height: 18px !important;
            }
          }
        `}
      </style>
      <div className="preview-actions no-print">
        <button className="btn-outline-small" onClick={() => navigate('/create-statement', { state: { statementData: statementData }, replace: true })}>
          <ArrowLeft size={16} /> Back to Edit
        </button>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Print Layout:</label>
          <select 
            value={printLayout} 
            onChange={(e) => setPrintLayout(e.target.value)}
            className="form-control"
            style={{ width: '120px', padding: '6px 12px' }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Print Statement
          </button>
        </div>
      </div>

      <div className="document-paper" style={{ padding: '5px', fontFamily: 'Arial, sans-serif' }}>
        
        {(() => {
          const govtItems = [
            "3611000019 9FT. ANGLE 65*65*6",
            "2609000076 9FT. ANGLE 50*50*5",
            "2609000011 4FT ANGLE 65*65*6",
            "2609000005 2.6FT ANGLE 65*65*6",
            "2609000058 2.6FT ANGLE 50*50*5",
            "2609000080 DO ANGLE",
            "2601000049 SIDE CLAMP",
            "2601000069 STAY CLAMP",
            "2601000040 U-CLAMP",
            "2609000034 V-CROOS ARM",
            "2601000084 TOP FITTING",
            "2614000002 ANCHOR ROAD",
            "2614000009 TURN BUCKLE",
            "2614000012 EYE BOLT",
            "0901000024 Earthing Coil",
            "2613000002 Three Hol Patti",
            "2609000086 6FT T-Channel"
          ];
          const actualMrNumbers = statementData.mrNumbers || [];
          const minColumns = 7;
          const paddedMrNumbers = [...actualMrNumbers];
          while (paddedMrNumbers.length < minColumns) {
            paddedMrNumbers.push('');
          }
          const contractorColSpan = Math.max(1, paddedMrNumbers.length - 2);

          return (
            <>
              {/* Header Section */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <img src="./logo address.png" alt="Neeta Engineering Works Logo" style={{ height: '80px', objectFit: 'contain', marginBottom: '0px' }} />
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Neeta Engineering Works</h1>
                  <p style={{ margin: '2px 0', fontSize: '14px', color: '#334155' }}>179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510</p>
                  <p style={{ margin: '2px 0', fontSize: '14px', color: '#334155' }}>GSTNO: 24ABHPP5386L1Z3</p>
                </div>
                <div style={{ alignSelf: 'flex-start', textAlign: 'right' }}>
                   <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 'bold'}}>Estimate Ready Material</h2>
                </div>
              </div>

              {/* The Exact Image Table Format */}
              <table className="statement-preview-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
                <thead>
                  {/* Row 1 */}
                  <tr>
                    <th style={{ ...cellStyle, width: '220px', fontWeight: 'bold' }}>fabrication material issud G.P</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>Con Name</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }} colSpan={contractorColSpan}>{statementData.contractorName}</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>Date</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>Lot No.</th>
                  </tr>
                  
                  {/* Row 2 */}
                  <tr>
                    <th style={{ ...cellStyle, color: '#f59e0b', fontWeight: 'bold' }}>{statementData.divisionName} Divasion</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>S/Dn Name</th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }} colSpan={contractorColSpan}>{statementData.subDivisionName}</th>
                    <th style={cellStyle}>
                      {statementData.date && statementData.date.includes('-') && statementData.date.split('-')[0].length === 4 
                        ? `${statementData.date.split('-')[2]}/${statementData.date.split('-')[1]}/${statementData.date.split('-')[0]}` 
                        : statementData.date}
                    </th>
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>{statementData.statementNo}</th>
                  </tr>
                  
                  {/* Row 3 */}
                  <tr>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }}>MR.NO</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`mr-${i}`} style={cellStyle}>{mr}</th>
                    ))}
                    <th style={{ ...cellStyle, fontWeight: 'bold' }}>Totel</th>
                  </tr>

                  {/* Row 4 */}
                  <tr>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }}>P.O.No.</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`po-${i}`} style={{ ...cellStyle, fontWeight: 'bold' }}>
                        {mr && statementData.poNumbers && statementData.poNumbers[mr] 
                          ? statementData.poNumbers[mr] 
                          : (mr && statementData.poNo && statementData.poNo !== 'Multiple' ? statementData.poNo : '')}
                      </th>
                    ))}
                    <th style={cellStyle}></th>
                  </tr>

                  {/* Row 5 */}
                  <tr>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }}>Rel No.</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`rel-${i}`} style={{ ...cellStyle, fontWeight: 'bold' }}>
                        {mr && statementData.relNumbers && statementData.relNumbers[mr] 
                          ? statementData.relNumbers[mr] 
                          : (mr && statementData.relNo && statementData.relNo !== 'Multiple' ? statementData.relNo : '')}
                      </th>
                    ))}
                    <th style={cellStyle}></th>
                  </tr>
                </thead>
                
                <tbody>
                  {/* 1. Standard Govt Items Fixed Rows */}
                  {govtItems.map((itemName, index) => {
                    const item = statementData.materials.find(m => m.name === itemName) || { name: itemName };
                    return (
                      <tr key={`govt-${index}`}>
                        <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{item.name}</td>
                        {paddedMrNumbers.map((mr, i) => (
                          <td key={`qty-${i}`} style={{ ...cellStyle, fontWeight: 'bold' }}>
                            {mr && item.mrQuantities && item.mrQuantities[mr] ? item.mrQuantities[mr] : ''}
                          </td>
                        ))}
                        <td style={{ ...cellStyle, fontWeight: 'bold' }}>{item.qty || ''}</td>
                      </tr>
                    );
                  })}
                  
                  {/* 2. Any Extra Items Added by User */}
                  {statementData.materials.filter(m => !govtItems.includes(m.name)).map((item, index) => (
                    <tr key={`extra-${index}`}>
                      <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{item.name}</td>
                      {paddedMrNumbers.map((mr, i) => (
                        <td key={`qty-${i}`} style={{ ...cellStyle, fontWeight: 'bold' }}>
                          {mr && item.mrQuantities && item.mrQuantities[mr] ? item.mrQuantities[mr] : ''}
                        </td>
                      ))}
                      <td style={{ ...cellStyle, fontWeight: 'bold' }}>{item.qty || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '90px', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '80px' }}>
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '100%', left: '0', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                      <img src="./sign.png" alt="Signature" style={{ height: '70px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ borderTop: '1px dashed #000', width: '200px', paddingTop: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                      Authorized Signatory
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>For Neeta Engineering Works</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

const cellStyle = {
  border: '1px solid black',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 'normal',
  color: 'black'
};
