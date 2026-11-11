import "./progressBar.css";

const ProgressBar = ({ step, currentRoleStep = false }) => {
  const steps = ["Peran", "Pendaftaran", "Data diri", "Verifikasi"];
  const activeStep = currentRoleStep
    ? 1
    : (step >= 1 && step <= 3 ? step + 1 : step);
  const fillClass =
    activeStep >= 4
      ? "full"
      : activeStep === 3
        ? "two-thirds"
        : activeStep === 2
          ? "one-third"
          : "";

  return (
    <div className="progress-container">
      <div className="progress-line">
        <div className={`progress-fill ${fillClass}`.trim()}></div>
      </div>
      {steps.map((label, index) => (
        <div key={index} className="progress-step">
          <div className={`circle ${activeStep >= index + 1 ? "active" : ""}`}></div>
          <span className={activeStep === index + 1 ? "active-label" : ""}>{label}</span>
        </div>
      ))}
    </div>
  );
};

export default ProgressBar;


