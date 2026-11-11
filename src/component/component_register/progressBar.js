import "./progressBar.css";

const ProgressBar = ({ step, currentRoleStep = false }) => {
  const steps = ["Pendaftaran", "Data diri", "Verifikasi", "Pilih Role"];
  const activeStep = currentRoleStep ? 4 : Number(step) || 1;
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


