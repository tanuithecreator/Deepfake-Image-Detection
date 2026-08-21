/**
 * Comprehensive Report Generator for DeepDetect Admin Dashboard
 * Generates PDF reports with system statistics, user data, and detection results
 */

import type { User, DetectionResult } from '../App';
import { formatDateTimeEAT, formatDateShort, getCurrentEAT } from './dateUtils';

export interface AdminStats {
  total_users: number;
  regular_users: number;
  admin_users: number;
  active_users: number;
  total_media_files: number;
  total_analyses: number;
  deepfakes_detected: number;
  authentic_detected: number;
  detection_rate: number;
  avg_confidence: number;
}

export interface ReportData {
  stats: AdminStats;
  users: User[];
  detectionResults: DetectionResult[];
  generatedAt: Date;
}

/**
 * Generate a comprehensive PDF report
 */
export async function generateComprehensiveReport(
  stats: AdminStats,
  users: User[],
  detectionResults: DetectionResult[]
): Promise<void> {
  const reportDate = getCurrentEAT();
  const reportDateStr = formatDateTimeEAT(reportDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Calculate additional statistics - use stats data when available
  const activeUsers = users.filter(u => u.status === 'active' && u.role === 'user').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  // Use stats.total_analyses if available, otherwise use detectionResults length
  const totalScans = stats.total_analyses > 0 ? stats.total_analyses : detectionResults.length;
  // Use stats data when available for more accurate counts
  const deepfakesCount = stats.deepfakes_detected > 0 ? stats.deepfakes_detected : detectionResults.filter(r => r.result === 'deepfake').length;
  const authenticCount = stats.authentic_detected > 0 ? stats.authentic_detected : detectionResults.filter(r => r.result === 'authentic').length;
  const avgConfidence = stats.avg_confidence > 0 ? Math.round(stats.avg_confidence) : (totalScans > 0
    ? Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / totalScans)
    : 0);

  // Recent activity (last 20 results)
  const recentActivity = detectionResults
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  // Top users by scan count - use totalScans from user object (from backend)
  const userScanCounts = users
    .map(user => ({
      user,
      scanCount: user.totalScans || detectionResults.filter(r => r.userId === user.id).length
    }))
    .sort((a, b) => b.scanCount - a.scanCount)
    .slice(0, 10);

  // Detection trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentResults = detectionResults.filter(r => new Date(r.date) >= thirtyDaysAgo);
  const recentDeepfakes = recentResults.filter(r => r.result === 'deepfake').length;
  const recentAuthentic = recentResults.filter(r => r.result === 'authentic').length;

  // Create HTML content for the report
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DeepDetect System Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      background: #f5f5f5;
    }
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .stat-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
    }
    .table-container {
      overflow-x: auto;
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    tr:hover {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-active {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-suspended {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-deepfake {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-authentic {
      background: #d1fae5;
      color: #065f46;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .highlight {
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>DeepDetect System Report</h1>
      <div class="subtitle">Generated on ${reportDateStr} (East African Time)</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <div class="value">${stats.total_users}</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${stats.regular_users} regular, ${stats.admin_users} admin
          </div>
        </div>
        <div class="stat-card">
          <h3>Active Users</h3>
          <div class="value" style="color: #059669;">${activeUsers}</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${suspendedUsers} suspended
          </div>
        </div>
        <div class="stat-card">
          <h3>Total Scans</h3>
          <div class="value">${totalScans}</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${stats.total_media_files} files uploaded
          </div>
        </div>
        <div class="stat-card">
          <h3>Deepfakes Detected</h3>
          <div class="value" style="color: #dc2626;">${deepfakesCount}</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${stats.detection_rate.toFixed(1)}% detection rate
          </div>
        </div>
        <div class="stat-card">
          <h3>Average Confidence</h3>
          <div class="value" style="color: #2563eb;">${avgConfidence}%</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            System accuracy
          </div>
        </div>
        <div class="stat-card">
          <h3>Authentic Content</h3>
          <div class="value" style="color: #059669;">${authenticCount}</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${totalScans > 0 ? ((authenticCount / totalScans) * 100).toFixed(1) : 0}% of total
          </div>
        </div>
      </div>
    </div>

    <!-- User Statistics -->
    <div class="section">
      <h2 class="section-title">User Statistics</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Last Active</th>
              <th>Total Scans</th>
            </tr>
          </thead>
          <tbody>
            ${users.filter(u => u.role === 'user').map(user => {
              const userScans = detectionResults.filter(r => r.userId === user.id).length;
              return `
                <tr>
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>
                    <span class="badge ${user.status === 'active' ? 'badge-active' : 'badge-suspended'}">
                      ${user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>${formatDateShort(user.joinDate)}</td>
                  <td>${formatDateShort(user.lastActive)}</td>
                  <td>${userScans}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Users by Activity -->
    <div class="section">
      <h2 class="section-title">Top 10 Most Active Users</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Email</th>
              <th>Total Scans</th>
              <th>Deepfakes Found</th>
            </tr>
          </thead>
          <tbody>
            ${userScanCounts.map((item, index) => {
              const userDeepfakes = detectionResults.filter(
                r => r.userId === item.user.id && r.result === 'deepfake'
              ).length;
              return `
                <tr>
                  <td>#${index + 1}</td>
                  <td>${item.user.name}</td>
                  <td>${item.user.email}</td>
                  <td><span class="highlight">${item.scanCount}</span></td>
                  <td>${userDeepfakes}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Detection Activity -->
    <div class="section">
      <h2 class="section-title">Recent Detection Activity (Last 20)</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>File Name</th>
              <th>Result</th>
              <th>Confidence</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            ${recentActivity.map(result => {
              const resultUser = users.find(u => u.id === result.userId);
              return `
                <tr>
                  <td>${formatDateShort(result.date)}</td>
                  <td>${result.fileName}</td>
                  <td>
                    <span class="badge ${result.result === 'deepfake' ? 'badge-deepfake' : 'badge-authentic'}">
                      ${result.result === 'deepfake' ? 'Deepfake' : 'Authentic'}
                    </span>
                  </td>
                  <td>${result.confidence}%</td>
                  <td>${resultUser?.name || 'Unknown'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detection Trends -->
    <div class="section">
      <h2 class="section-title">Detection Trends (Last 30 Days)</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Scans (30 Days)</h3>
          <div class="value">${recentResults.length}</div>
        </div>
        <div class="stat-card">
          <h3>Deepfakes (30 Days)</h3>
          <div class="value" style="color: #dc2626;">${recentDeepfakes}</div>
        </div>
        <div class="stat-card">
          <h3>Authentic (30 Days)</h3>
          <div class="value" style="color: #059669;">${recentAuthentic}</div>
        </div>
        <div class="stat-card">
          <h3>Detection Rate (30 Days)</h3>
          <div class="value" style="color: #2563eb;">
            ${recentResults.length > 0 ? ((recentDeepfakes / recentResults.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="section">
      <h2 class="section-title">System Health Metrics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Detection Accuracy</h3>
          <div class="value" style="color: #2563eb;">${avgConfidence}%</div>
        </div>
        <div class="stat-card">
          <h3>Overall Detection Rate</h3>
          <div class="value" style="color: #dc2626;">${stats.detection_rate.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <h3>System Uptime</h3>
          <div class="value" style="color: #059669;">Active</div>
        </div>
        <div class="stat-card">
          <h3>Model Version</h3>
          <div class="value" style="color: #7c3aed;">Combined ResNet18 v1.0.0</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>This report was automatically generated by DeepDetect System Administration</p>
      <p>For questions or support, please contact the system administrator</p>
    </div>
  </div>
</body>
</html>
  `;

  // Create a blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deepdetect-report-${formatDateTimeEAT(reportDate, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/[^\w]/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);

  // Also try to print/save as PDF if browser supports it
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

