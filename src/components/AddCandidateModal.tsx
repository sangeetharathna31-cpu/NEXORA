import { useState } from "react";
import { Button, Modal } from "./ui";

export function AddCandidateModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, text: string) => void;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!text.trim()) return setError("Paste the resume text to add a candidate.");
    onAdd(name.trim() || "Unnamed candidate", text.trim());
  };
  return (
    <Modal
      eyebrow="Add candidate"
      title="Paste a resume"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="plus" onClick={submit}>Add candidate</Button>
        </>
      }
    >
      <div className="form-content modal-form">
        <label className="field">
          <span>Candidate name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha Rao" autoFocus />
        </label>
        <label className="field">
          <span>Resume text</span>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setError(""); }} placeholder="Paste resume text…" rows={9} />
          {error && <small className="field-error">{error}</small>}
        </label>
      </div>
    </Modal>
  );
}
