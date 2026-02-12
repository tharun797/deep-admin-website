import React from 'react';

interface Stat {
  label: string;
  value: string;
  change: string;
  color: string;
}

interface Activity {
  action: string;
  user: string;
  time: string;
}

interface Styles {
  statsGrid: React.CSSProperties;
  statCard: React.CSSProperties;
  statLabel: React.CSSProperties;
  statValue: React.CSSProperties;
  statChange: React.CSSProperties;
  statBar: React.CSSProperties;
  section: React.CSSProperties;
  sectionTitle: React.CSSProperties;
  activityList: React.CSSProperties;
  activityItem: React.CSSProperties;
  activityDot: React.CSSProperties;
  activityContent: React.CSSProperties;
  activityAction: React.CSSProperties;
  activityMeta: React.CSSProperties;
}

const Overview: React.FC = () => {
  const stats: Stat[] = [
    { label: 'Total Users', value: '2,543', change: '+12%', color: '#FF6DD9' },
    { label: 'Active Today', value: '892', change: '+8%', color: '#8336C7' },
    { label: 'New Signups', value: '124', change: '+23%', color: '#00D4AA' },
    { label: 'Revenue', value: '$45.2K', change: '+15%', color: '#FFB800' },
  ];

  const activities: Activity[] = [
    { action: 'New user registered', user: 'john@example.com', time: '2 min ago' },
    { action: 'Payment received', user: 'sarah@example.com', time: '15 min ago' },
    { action: 'Profile updated', user: 'mike@example.com', time: '1 hour ago' },
    { action: 'New subscription', user: 'emma@example.com', time: '2 hours ago' },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={styles.statLabel}>{stat.label}</div>
            <div style={styles.statValue}>{stat.value}</div>
            <div style={{ ...styles.statChange, color: stat.color }}>
              {stat.change} from last month
            </div>
            <div
              style={{
                ...styles.statBar,
                background: `linear-gradient(90deg, ${stat.color}22, ${stat.color})`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityList}>
          {activities.map((activity, index) => (
            <div key={index} style={styles.activityItem}>
              <div style={styles.activityDot} />
              <div style={styles.activityContent}>
                <div style={styles.activityAction}>{activity.action}</div>
                <div style={styles.activityMeta}>
                  {activity.user} • {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.75rem',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    position: 'relative',
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1d29',
    marginBottom: '0.5rem',
    letterSpacing: '-1px',
  },
  statChange: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1a1d29',
    marginBottom: '1.5rem',
    letterSpacing: '-0.5px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#FF6DD9',
    marginTop: '8px',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1a1d29',
    marginBottom: '4px',
  },
  activityMeta: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
};

export default Overview;