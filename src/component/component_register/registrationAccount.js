import React from "react";
import ProgressBar from "./progressBar"; 
import "./registrationAccount.css"; 
import { ButtonNext, ButtonRegisterGoogle, InputConfirmPassword, InputEmail, InputPassword, InputUsername } from "./atoms";

const RegistrationAccount = ({ account, updateAccount, nextStep, onGoogle, disabled }) => {

  return (
    <div className="register-form">
      <ProgressBar step={1} />
      <InputEmail email={account.email} setEmail={(email) => updateAccount({ email })} />
      <InputUsername username={account.username} setUsername={(username) => updateAccount({ username })} />
      <InputPassword password={account.password} setInputPassword={(password) => updateAccount({ password })} />
      <InputConfirmPassword password={account.password} confirmPassword={account.confirmPassword} setConfirmPassword={(confirmPassword) => updateAccount({ confirmPassword })} />
      <ButtonNext
        disabled={disabled}
        onClick={() => account.email && account.username && account.password === account.confirmPassword && nextStep()}
      />
      <ButtonRegisterGoogle onClick={onGoogle} disabled={disabled} />
    </div>
  );
};

export default RegistrationAccount;
