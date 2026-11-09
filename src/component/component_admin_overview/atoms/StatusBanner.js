import "./StatusBanner.css";

const StatusBanner = ({ message }) => (
  <p className="status-banner" role="status">
    {message}
  </p>
);

export default StatusBanner;
