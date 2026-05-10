import './MedSense_Dashboard/globals.css';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-wrapper">
      {children}
    </div>
  );
}
