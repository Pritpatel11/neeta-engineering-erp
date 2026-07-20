import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Plus, TrendingUp, Truck, 
  AlertTriangle, Package, Factory, Eye, FileText, Database, RefreshCcw, X, History
} from 'lucide-react';
import { 
  getChallans, getStatements, 
  getRemainingMaterials, getInventoryBalances,
  getDivisions, triggerBackup, getBackups, restoreBackup,
  getStoreReceipts, getQuotations
} from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { formatIndianNumber } from '../utils/numberFormat';
import './Dashboard.css';


export default function Dashboard() {
  const navigate = useNavigate();
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // Restore feature states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupsList, setBackupsList] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Data states
  const [recentChallans, setRecentChallans] = useState([]);
  const [recentStatements, setRecentStatements] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [kpis, setKpis] = useState({
    totalChallans: 0,
    totalStatements: 0,
    totalLeftovers: 0,
    lowStockCount: 0
  });
  
  // Chart states
  const [allBalances, setAllBalances] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('Deesa');
  const [divisionsList, setDivisionsList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [contractorChartData, setContractorChartData] = useState([]);
  const [topMaterialChartData, setTopMaterialChartData] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [challans, statements, leftovers, balances, divs, receipts, quotations] = await Promise.all([
          getChallans(),
          getStatements(),
          getRemainingMaterials(),
          getInventoryBalances(),
          getDivisions(),
          getStoreReceipts(),
          getQuotations()
        ]);
        
        const divNames = divs.map(d => d.name);
        setDivisionsList(divNames);
        if (divNames.length > 0 && selectedDivision === 'Deesa' && !divNames.includes('Deesa')) {
           setSelectedDivision(divNames[0]);
        }

        // Process KPIs
        const sortedChallans = [...challans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentChallans(sortedChallans.slice(0, 5));
        
        const sortedStatements = [...statements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentStatements(sortedStatements.slice(0, 5));

        // Build Activity Feed
        const feed = [
          ...challans.map(c => ({ id: `c_${c._id}`, type: 'Challan', text: `New Delivery Challan generated for ${c.contractorName}`, date: new Date(c.createdAt), icon: '🟢', color: '#10b981' })),
          ...statements.map(s => ({ id: `s_${s._id}`, type: 'Statement', text: `Statement recorded for ${s.divisionName}`, date: new Date(s.createdAt), icon: '📄', color: '#3b82f6' })),
          ...receipts.map(r => ({ id: `r_${r._id}`, type: 'CR', text: `Material Inward (CR) from ${r.conName || r.divisionName}`, date: new Date(r.createdAt), icon: '📦', color: '#f59e0b' })),
          ...quotations.map(q => ({ id: `q_${q._id}`, type: 'Quotation', text: `Quotation created for ${q.clientName || q.companyName}`, date: new Date(q.createdAt), icon: '💰', color: '#8b5cf6' }))
        ];
        feed.sort((a, b) => b.date - a.date);
        setActivityFeed(feed.slice(0, 8)); // Top 8 recent activities

        let negativeStockCount = 0;
        const alerts = [];
        balances.forEach(div => {
          if (div.materials) {
            div.materials.forEach(mat => {
              if (mat.qty < 0) negativeStockCount++;
              if (mat.qty < 5) {
                alerts.push({
                  division: div.divisionName,
                  material: mat.name,
                  qty: mat.qty
                });
              }
            });
          }
        });
        
        alerts.sort((a, b) => a.qty - b.qty);
        setLowStockAlerts(alerts);

        setKpis({
          totalChallans: challans.length,
          totalStatements: statements.length,
          totalLeftovers: leftovers.length,
          lowStockCount: negativeStockCount
        });

        setAllBalances(balances);

        // Aggregation for Contractor Activity (Pie Chart) - based on Challans
        const contractorCounts = {};
        challans.forEach(c => {
          if (c.contractorName) {
            contractorCounts[c.contractorName] = (contractorCounts[c.contractorName] || 0) + 1;
          }
        });
        const contractorData = Object.keys(contractorCounts).map(name => ({
          name,
          value: contractorCounts[name]
        }));
        setContractorChartData(contractorData);

        // Aggregation for Top Used Materials (Bar Chart) - based on Statements
        const materialCounts = {};
        statements.forEach(s => {
          if (s.materials) {
            s.materials.forEach(m => {
              if (m.name && m.qty) {
                materialCounts[m.name] = (materialCounts[m.name] || 0) + Number(m.qty);
              }
            });
          }
        });
        
        const sortedMaterials = Object.keys(materialCounts)
          .map(name => {
            const parts = name.split(' ');
            const shortName = parts.length > 1 ? parts.slice(1).join(' ') : name;
            return {
              fullName: name,
              name: shortName.substring(0, 15) + (shortName.length > 15 ? '...' : ''),
              quantity: materialCounts[name]
            };
          })
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5); // Top 5

        setTopMaterialChartData(sortedMaterials);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, []);

  // Update chart data when division changes
  useEffect(() => {
    const divisionData = allBalances.find(b => b.divisionName === selectedDivision);
    if (divisionData && divisionData.materials) {
      // Format data for Recharts
      const formattedData = divisionData.materials.map(m => {
        // Shorten the name by removing the leading 10-digit code for the graph label
        const parts = m.name.split(' ');
        const shortName = parts.length > 1 ? parts.slice(1).join(' ') : m.name;
        
        return {
          fullName: m.name,
          name: shortName.substring(0, 15) + (shortName.length > 15 ? '...' : ''), // Max 15 chars for x-axis
          quantity: m.qty || 0
        };
      });
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [selectedDivision, allBalances]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNegative = data.quantity < 0;
      return (
        <div style={{ 
          background: '#ffffff', 
          padding: '12px 16px', 
          border: '1px solid #e1e6f1', 
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ fontWeight: '700', fontSize: '11px', color: '#1b2e4b', marginBottom: '8px', textTransform: 'uppercase' }}>{data.fullName}</p>
          <p style={{ color: isNegative ? '#dc3545' : '#6f42c1', margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Balance: {formatIndianNumber(data.quantity)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      await triggerBackup();
      alert('Database backup completed successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to backup database: ${errorMsg}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleOpenRestore = async () => {
    try {
      const data = await getBackups();
      setBackupsList(data);
      setShowRestoreModal(true);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      alert('Could not fetch backups list');
    }
  };

  const handleRestore = async (filename) => {
    const confirmMessage = "⚠️ WARNING ⚠️\n\nRestoring this backup will PERMANENTLY OVERWRITE your current database. All data added after this backup will be LOST.\n\nAre you absolutely sure you want to proceed?";
    const isConfirmed = window.confirm(confirmMessage);
    
    if (!isConfirmed) {
      return;
    }

    try {
      setIsRestoring(true);
      await restoreBackup(filename);
      alert('Restore successful! The application will now reload to show the restored data.');
      window.location.reload();
    } catch (error) {
      console.error('Restore failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to restore backup: ${errorMsg}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Clock & Greeting
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning ☀️' : hour < 18 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';

  // Financial Year Logic
  const calculateFYProgress = () => {
    const today = currentTime;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    let fyStart, fyEnd;
    let fyLabel;
    
    if (currentMonth >= 3) { // April (3) or later
      fyStart = new Date(currentYear, 3, 1);
      fyEnd = new Date(currentYear + 1, 2, 31);
      fyLabel = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else { // Jan, Feb, Mar
      fyStart = new Date(currentYear - 1, 3, 1);
      fyEnd = new Date(currentYear, 2, 31);
      fyLabel = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
    
    const totalDays = Math.round((fyEnd - fyStart) / (1000 * 60 * 60 * 24));
    const passedDays = Math.round((today - fyStart) / (1000 * 60 * 60 * 24));
    const daysLeft = totalDays - passedDays;
    const progressPercentage = Math.max(0, Math.min(100, (passedDays / totalDays) * 100));
    
    return { fyLabel, progressPercentage, daysLeft };
  };
  
  const fyData = calculateFYProgress();
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentDayIndex = currentTime.getDay();

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="dashboard-title">{greeting}, Neeta Enginnering Works!</h1>
          <p className="dashboard-subtitle">
            <span style={{ fontWeight: '600', color: '#6f42c1', marginRight: '12px' }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            Real-time production, logistics, and inventory metrics.
          </p>
        </div>
        <div className="dashboard-actions">
          <button 
            className="btn-outline-small" 
            onClick={handleBackup}
            disabled={isBackingUp || isRestoring}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}
          >
            <Database size={14} /> {isBackingUp ? 'Backing up...' : 'Backup Data'}
          </button>
          <button 
            className="btn-outline-small" 
            onClick={handleOpenRestore}
            disabled={isBackingUp || isRestoring}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px', color: '#d97706', borderColor: '#fcd34d' }}
          >
            <History size={14} /> {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
          <button className="btn-primary" onClick={() => navigate('/create-statement')}>
            <Plus size={14} /> New Statement
          </button>
          <button className="btn-primary alt" onClick={() => navigate('/create-challan')}>
            <Truck size={14} /> New Challan
          </button>
        </div>
      </div>

      {/* Micro-UI Features Bar */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* FY Progress Bar */}
        <div className="glass-panel" style={{ flex: '1 1 400px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e1e6f1', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
            <span style={{ color: '#1b2e4b', letterSpacing: '0.5px' }}>FINANCIAL YEAR {fyData.fyLabel}</span>
            <span style={{ color: '#6f42c1' }}>{fyData.progressPercentage.toFixed(1)}% <span style={{ color: '#6c757d', fontWeight: '500' }}>({fyData.daysLeft} Days Left)</span></span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#eff4ff', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${fyData.progressPercentage}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #0059bb 0%, #6f42c1 100%)',
              borderRadius: '4px',
              transition: 'width 1s ease-in-out'
            }}></div>
          </div>
        </div>

        {/* Mini Weekly Calendar */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e1e6f1', background: '#ffffff', flexShrink: 0 }}>
          {daysOfWeek.map((day, idx) => (
            <div key={idx} style={{
              width: '32px', height: '32px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700',
              background: idx === currentDayIndex ? 'linear-gradient(135deg, #0059bb 0%, #0070ea 100%)' : '#f8f9fa',
              color: idx === currentDayIndex ? 'white' : '#adb5bd',
              boxShadow: idx === currentDayIndex ? '0 4px 10px rgba(0, 89, 187, 0.3)' : 'none',
              border: idx === currentDayIndex ? 'none' : '1px solid #e1e6f1',
              transition: 'all 0.3s ease'
            }}>
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="dashboard-card kpi-card">
          <span className="kpi-header text-primary">TOTAL STATEMENTS</span>
          <div className="kpi-body">
            <div className="kpi-value">{formatIndianNumber(kpis.totalStatements).replace('.00', '')}</div>
            <div className="kpi-trend">Lifetime generated records</div>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <span className="kpi-header text-secondary">TOTAL CHALLANS</span>
          <div className="kpi-body">
            <div className="kpi-value">{formatIndianNumber(kpis.totalChallans).replace('.00', '')}</div>
            <div className="kpi-trend">Lifetime dispatched deliveries</div>
          </div>
        </div>

        <div className="dashboard-card kpi-card">
          <span className="kpi-header text-success">LEFTOVER LOTS</span>
          <div className="kpi-body">
            <div className="kpi-value">{formatIndianNumber(kpis.totalLeftovers).replace('.00', '')}</div>
            <div className="kpi-trend">Pending dispatch records</div>
          </div>
        </div>

        <div className="dashboard-card kpi-card" style={{ borderLeft: kpis.lowStockCount > 0 ? '4px solid #dc3545' : '' }}>
          <span className="kpi-header text-tertiary">OVERDRAFT ALERT</span>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.lowStockCount}</div>
            <div className="kpi-trend">Materials in <span>Negative</span> Balance</div>
          </div>
        </div>
      </div>

      {/* Inventory Charts Section */}
      <div className="dashboard-card chart-section">
        <div className="chart-header">
          <h2 className="chart-title">
            <Factory className="text-primary" size={16} />
            DIVISION MATERIAL BALANCE
          </h2>
          <div className="division-filters">
            {divisionsList.map(div => (
              <button 
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`division-btn ${selectedDivision === div ? 'active' : ''}`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ width: '100%', height: 350 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6f42c1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6f42c1" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc3545" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#dc3545" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e1e6f1" opacity={0.7} />
                <XAxis 
                  dataKey="name" 
                  angle={-35} 
                  textAnchor="end" 
                  tick={{ fontSize: 10, fill: '#8392a5', fontWeight: 500 }} 
                  height={60}
                  tickMargin={10}
                  axisLine={{ stroke: '#e1e6f1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#8392a5', fontWeight: 500 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa', opacity: 0.6 }}/>
                <Bar 
                  dataKey="quantity" 
                  radius={[4, 4, 0, 0]}
                  name="Current Stock Balance"
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.quantity < 0 ? 'url(#colorNegative)' : 'url(#colorPositive)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8392a5', fontSize: '14px' }}>
              Loading balance data...
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics Grid */}
      <div className="charts-grid-2">
        <div className="dashboard-card chart-section">
          <div className="chart-header">
            <h2 className="chart-title">
              <Truck className="text-primary" size={16} />
              TOP CONTRACTORS (BY CHALLANS)
            </h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {contractorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={contractorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contractorChartData.map((entry, index) => {
                      const COLORS = ['#6f42c1', '#007bff', '#28a745', '#ffc107', '#17a2b8', '#fd7e14'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8392a5', fontSize: '14px' }}>
                Not enough data yet.
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card chart-section">
          <div className="chart-header">
            <h2 className="chart-title">
              <Package className="text-primary" size={16} />
              MOST USED MATERIALS
            </h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {topMaterialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={topMaterialChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e1e6f1" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8f9fa'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="quantity" fill="#007bff" radius={[0, 4, 4, 0]} barSize={20} name="Total Dispatched" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8392a5', fontSize: '14px' }}>
                Not enough data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockAlerts.length > 0 && (
        <div className="dashboard-card" style={{ marginBottom: '24px', borderLeft: '4px solid #ef4444' }}>
          <div className="data-grid-header">
            <h2 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <AlertTriangle size={18} /> LOW STOCK ALERTS <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>(Stock &lt; 5)</span>
            </h2>
            <button className="btn-link text-error" onClick={() => navigate('/inventory-balance')}>Manage Inventory</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0 12px 0' }}>
            {lowStockAlerts.map((alert, idx) => (
              <div key={idx} style={{ 
                minWidth: '200px',
                flex: '1 1 200px',
                maxWidth: '300px',
                background: alert.qty < 0 ? '#fee2e2' : '#ffedd5', 
                border: `1px solid ${alert.qty < 0 ? '#fca5a5' : '#fdba74'}`,
                borderRadius: '8px', 
                padding: '12px' 
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
                  {alert.division}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={alert.material}>
                  {alert.material}
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: alert.qty < 0 ? '#dc2626' : '#ea580c' 
                }}>
                  {alert.qty} left
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section: Data Grids & Feed */}
      <div className="dashboard-grid">
        <div className="dashboard-card data-grid">
          <div className="data-grid-header">
            <h2 className="widget-title">RECENT STATEMENTS</h2>
            <button className="btn-link" onClick={() => navigate('/statement-register')}>View All</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stmt No.</th>
                  <th>Date</th>
                  <th>Division</th>
                  <th>Contractor</th>
                </tr>
              </thead>
              <tbody>
                {recentStatements.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#8392a5' }}>
                      No statements found.
                    </td>
                  </tr>
                ) : (
                  recentStatements.map((stmt, idx) => (
                    <tr key={stmt._id || idx}>
                      <td className="font-mono text-primary" style={{ fontWeight: 600 }}>{stmt.statementNo}</td>
                      <td style={{ color: '#8392a5' }}>{stmt.date}</td>
                      <td>{stmt.divisionName}</td>
                      <td>{stmt.contractorName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="dashboard-card data-grid" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="data-grid-header" style={{ marginBottom: '0px' }}>
            <h2 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="#6f42c1" /> LIVE ACTIVITY FEED
            </h2>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', marginTop: '16px', maxHeight: '350px' }}>
            {activityFeed.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8392a5', margin: '40px 0' }}>No recent activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: '#e1e6f1', zIndex: 0 }}></div>
                {activityFeed.map((item, idx) => {
                  const diffMinutes = Math.floor((new Date() - item.date) / 60000);
                  let timeAgoStr = diffMinutes < 1 ? 'Just now' : diffMinutes < 60 ? `${diffMinutes} mins ago` : diffMinutes < 1440 ? `${Math.floor(diffMinutes/60)} hours ago` : `${Math.floor(diffMinutes/1440)} days ago`;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, alignItems: 'flex-start' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: `2px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, background: '#f8f9fa', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#111827', fontWeight: '500', lineHeight: '1.4' }}>{item.text}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>{timeAgoStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '500px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#d97706" /> Restore Database
              </h2>
              {!isRestoring && <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowRestoreModal(false)} />}
            </div>
            
            <div style={{ padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px', lineHeight: '1.5' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Warning: Data Overwrite</strong>
                Restoring a backup will erase all current database entries and replace them with the data from the selected backup file.
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {backupsList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No backups found in the configured directory.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {backupsList.map((backup, idx) => {
                    const dateObj = new Date(backup.createdAt);
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{backup.filename}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString()} &bull; {(backup.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRestore(backup.filename)}
                          disabled={isRestoring}
                          style={{
                            padding: '6px 12px', backgroundColor: isRestoring ? '#d1d5db' : '#ef4444',
                            color: 'white', border: 'none', borderRadius: '6px', cursor: isRestoring ? 'not-allowed' : 'pointer',
                            fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <RefreshCcw size={14} /> Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
