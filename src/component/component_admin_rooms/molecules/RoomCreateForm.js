import React from "react";
import "./RoomCreateForm.css";
import RoomFormInput from "../atoms/RoomFormInput";

const RoomCreateForm = ({ roomName, setRoomName, roomCapacity, setRoomCapacity, onSubmit, isProcessing }) => (
  <form className="room-create-form" onSubmit={onSubmit}>
    <RoomFormInput
      label="Nama room"
      value={roomName}
      onChange={(e) => setRoomName(e.target.value)}
      placeholder="Room baru"
      maxLength={80}
    />
    <RoomFormInput
      label="Kapasitas"
      type="number"
      value={roomCapacity}
      onChange={(e) => setRoomCapacity(e.target.value)}
      min="1"
      max="1000"
    />
    <button type="submit" className="room-create-form__submit" disabled={isProcessing}>
      {isProcessing ? "Membuat…" : "Buat room"}
    </button>
  </form>
);

export default RoomCreateForm;
