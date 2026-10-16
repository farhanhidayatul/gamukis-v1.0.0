import React from "react";
import "./personalInfo.css"
import ProgressBar from "./progressBar";
import { ButtonBack, ButtonNext, ButtonRegisterGoogle, CheckboxJenisKelamin, InputAlamat, InputNamaSekolah, InputTanggalLahir } from "./atoms";

const PersonalInfo = ({ profile, updateProfile, nextStep, prevStep, onGoogle, disabled }) => {
  return (
    <div className="personalInfo-form">
      <ProgressBar step={2} />

      {/* Jenis Kelamin */}
      <CheckboxJenisKelamin value={profile.gender} onChange={(gender) => updateProfile({ gender })} />

      {/* Tanggal Lahir */}
      <InputTanggalLahir value={profile.birthDate} onChange={(birthDate) => updateProfile({ birthDate })} />

      {/* Nama Sekolah */}
      <InputNamaSekolah value={profile.school} onChange={(e) => updateProfile({ school: e.target.value })} />

      {/* Alamat */}
      <InputAlamat value={profile.address} onChange={(e) => updateProfile({ address: e.target.value })} />

      {/* Tombol Lanjutkan */}
      <div className="register-action-group">
        <ButtonBack onClick={prevStep} />
        <ButtonNext
          onClick={nextStep}
          disabled={disabled || profile.birthDate.length !== 8}
        />
      </div>
      <ButtonRegisterGoogle onClick={onGoogle} disabled={disabled} />
    </div>
  );
};

export default PersonalInfo;
